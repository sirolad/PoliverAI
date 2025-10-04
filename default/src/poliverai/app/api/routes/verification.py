import asyncio
import json
import logging
import os
import tempfile
from collections.abc import AsyncGenerator
from pathlib import Path

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from ....core.auth import verify_token
from ....db.users import user_db
from ....domain.auth import User, UserTier
from ....ingestion.readers.docx_reader import read_docx_text
from ....ingestion.readers.html_reader import read_html_text
from ....ingestion.readers.pdf_reader import read_pdf_text
from ....reporting.exporter import export_report
from ....rag.verification import analyze_policy
from ....rag.verification import analyze_policy_stream
from ....core.config import get_settings


class ClauseMatch(BaseModel):
    article: str
    policy_excerpt: str
    score: float


class Finding(BaseModel):
    article: str
    issue: str
    severity: str
    confidence: float


class Recommendation(BaseModel):
    article: str
    suggestion: str


class ComplianceMetrics(BaseModel):
    total_violations: int
    total_fulfills: int
    critical_violations: int


class ComplianceResult(BaseModel):
    verdict: str
    score: int
    confidence: float
    evidence: list[ClauseMatch]
    findings: list[Finding]
    recommendations: list[Recommendation]
    summary: str
    metrics: ComplianceMetrics


router = APIRouter(tags=["verification"])

security = HTTPBearer(auto_error=False)

# Dependency constants to avoid B008 errors
SECURITY_OPTIONAL_DEPENDENCY = Depends(security)


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = SECURITY_OPTIONAL_DEPENDENCY,
) -> User | None:
    """Get current user if authenticated, None otherwise."""
    if not credentials:
        return None

    token = credentials.credentials
    email = verify_token(token)

    if email is None:
        return None

    user_in_db = user_db.get_user_by_email(email)
    if user_in_db is None:
        return None

    # Return user without password hash
    return User(
        id=user_in_db.id,
        name=user_in_db.name,
        email=user_in_db.email,
        tier=user_in_db.tier,
        credits=user_in_db.credits,
        subscription_expires=user_in_db.subscription_expires,
        created_at=user_in_db.created_at,
        is_active=user_in_db.is_active,
    )


# Create dependency constant for get_current_user_optional to avoid B008 errors
CURRENT_USER_OPTIONAL_DEPENDENCY = Depends(get_current_user_optional)


@router.post("/verify", response_model=ComplianceResult)
async def verify(
    file: UploadFile,
    analysis_mode: str | None = Form(
        "fast", description="Analysis mode: 'fast', 'balanced', or 'detailed'"
    ),
    ingest: bool = Form(False, description="If true, ingest the uploaded file into the RAG store after analysis"),
    generate_report: bool = Form(False, description="If true, generate a PDF report after analysis"),
    current_user: User | None = CURRENT_USER_OPTIONAL_DEPENDENCY,
) -> ComplianceResult:
    # Handle different file types properly

    # Save uploaded file to temporary location
    raw = await file.read()

    # Determine file extension
    filename = file.filename or "upload.txt"
    file_ext = Path(filename).suffix.lower()

    # Create temporary file with proper extension and keep until ingestion/report complete
    tmpdir = Path(tempfile.mkdtemp(prefix="poliverai_verify_temp_"))
    temp_file = tmpdir / f"upload{file_ext}"
    temp_file.write_bytes(raw)

    try:
        # Extract text based on file type
        if file_ext == ".pdf":
            text = read_pdf_text(str(temp_file))
        elif file_ext == ".docx":
            text = read_docx_text(str(temp_file))
        elif file_ext in {".html", ".htm"}:
            text = read_html_text(str(temp_file))
        else:
            # Default to text file (txt, md, etc.)
            try:
                text = raw.decode("utf-8", errors="ignore")
            except Exception:
                text = ""
    except Exception as e:
        # Clean up on failure to extract
        try:
            temp_file.unlink(missing_ok=True)
            tmpdir.rmdir()
        except Exception:
            pass
        raise

    # Check user tier and restrict analysis modes for free users
    effective_mode = analysis_mode or "fast"

    if current_user is None or current_user.tier == UserTier.FREE:
        # Free users can only use fast mode
        if effective_mode in ["balanced", "detailed"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "message": "Advanced analysis modes require a Pro subscription",
                    "upgrade_required": True,
                    "requested_mode": effective_mode,
                    "available_mode": "fast",
                },
            )
        effective_mode = "fast"

    # Run RAG-based verification over clauses with specified analysis mode
    result = analyze_policy(text, analysis_mode=effective_mode)

    # Optionally ingest the original file into the RAG store so it is available
    # for future queries. This is optional because ingestion can be expensive.
    if ingest:
        try:
            from ....rag.service import ingest_paths

            stats = ingest_paths([str(temp_file)])
            logging.info("Ingested file %s -> %s", temp_file, stats)
        except Exception:
            logging.exception("Failed to ingest file %s", temp_file)

    # Optionally generate a PDF report from the analysis result
    if generate_report:
        try:
            # Create a simple markdown summary for the report
            md_lines = [f"# Compliance Report\n", f"**Verdict:** {result.get('verdict')}\n", f"**Score:** {result.get('score')}\n", f"**Summary:** {result.get('summary')}\n\n", "## Findings\n"]
            for f in result.get('findings', []):
                md_lines.append(f"- {f.get('article')}: {f.get('issue')}\n")
            md = "\n".join(md_lines)
            report_path = export_report(md, out_dir=get_settings().reports_dir)
            logging.info("Generated report: %s", report_path)
        except Exception:
            logging.exception("Failed to generate report for %s", temp_file)

    # Clean up temporary file and directory after optional ingest/report
    try:
        temp_file.unlink(missing_ok=True)
        tmpdir.rmdir()
    except Exception as e:
        logging.warning(f"Failed to cleanup temp file: {e}")

    # PERFORMANCE OPTIMIZATION: Skip RAG ingestion for verification-only requests
    # This optional step can add significant latency. Users can use the separate
    # ingest endpoint if they want to index files for future queries.
    # This improves verification speed from ~10s to ~0.1s for typical files.

    # Convert dict -> ComplianceResult model
    evidence_models = [
        ClauseMatch(
            article=e.get("article", "Unknown"),
            policy_excerpt=e.get("policy_excerpt", ""),
            score=float(e.get("score", 0.5)),
        )
        for e in result.get("evidence", [])
    ]
    findings_models = [
        Finding(
            article=f.get("article", "Unknown"),
            issue=f.get("issue", ""),
            severity=f.get("severity", "low"),
            confidence=float(f.get("confidence", 0.6)),
        )
        for f in result.get("findings", [])
    ]
    rec_models = [
        Recommendation(article=r.get("article", "Unknown"), suggestion=r.get("suggestion", ""))
        for r in result.get("recommendations", [])
    ]

    # Extract metrics
    metrics_data = result.get("metrics", {})
    metrics_model = ComplianceMetrics(
        total_violations=metrics_data.get("total_violations", 0),
        total_fulfills=metrics_data.get("total_fulfills", 0),
        critical_violations=metrics_data.get("critical_violations", 0),
    )

    return ComplianceResult(
        verdict=result.get("verdict", "non_compliant"),
        score=int(result.get("score", 50)),
        confidence=float(result.get("confidence", 0.65)),
        evidence=evidence_models,
        findings=findings_models,
        recommendations=rec_models,
        summary=result.get("summary", "Policy analysis completed."),
        metrics=metrics_model,
    )



@router.post("/verify-stream")
async def verify_stream(
    file: UploadFile,
    analysis_mode: str | None = Form(
        "fast", description="Analysis mode: 'fast', 'balanced', or 'detailed'"
    ),
    ingest: bool = Form(False, description="If true, ingest the uploaded file into the RAG store after analysis"),
    generate_report: bool = Form(False, description="If true, generate a PDF report after analysis"),
    current_user: User | None = CURRENT_USER_OPTIONAL_DEPENDENCY,
) -> StreamingResponse:
    """Stream policy verification with real-time progress updates."""
    # CRITICAL: Extract text BEFORE creating the async generator to avoid file access issues
    try:
        # Handle different file types properly
        raw = await file.read()
        # Determine file extension
        filename = file.filename or "upload.txt"
        file_ext = Path(filename).suffix.lower()
        # Create temporary file with proper extension
        tmpdir = Path(tempfile.mkdtemp(prefix="poliverai_verify_temp_"))
        temp_file = tmpdir / f"upload{file_ext}"
        temp_file.write_bytes(raw)
        try:
            # Extract text based on file type
            if file_ext == ".pdf":
                text = read_pdf_text(str(temp_file))
            elif file_ext == ".docx":
                text = read_docx_text(str(temp_file))
            elif file_ext in {".html", ".htm"}:
                text = read_html_text(str(temp_file))
            else:
                # Default to text file (txt, md, etc.)
                try:
                    text = raw.decode("utf-8", errors="ignore")
                except Exception:
                    text = ""
        finally:
            # Clean up temp file immediately after text extraction
            try:
                temp_file.unlink(missing_ok=True)
                tmpdir.rmdir()
            except Exception as e:
                logging.warning(f"Failed to cleanup temp file: {e}")
        # Validate we have extracted text
        if not text or not text.strip():
            async def error_stream():
                error_msg = json.dumps(
                    {
                        "status": "error",
                        "progress": 0,
                        "message": "No text could be extracted from the uploaded file",
                    }
                )
                yield f"data: {error_msg}\n\n"
            return StreamingResponse(error_stream(), media_type="text/plain")
        # Check user tier and restrict analysis modes for free users
        effective_mode = analysis_mode or "fast"
        # Check for Gradio bypass flag (for development/demo purposes)
        gradio_bypass_auth = os.getenv("GRADIO_BYPASS_AUTH", "false").lower() == "true"
        if not gradio_bypass_auth and (current_user is None or current_user.tier == UserTier.FREE):
            # Free users can only use fast mode (unless bypass is enabled)
            if effective_mode in ["balanced", "detailed"]:
                async def auth_error_stream():
                    error_msg = json.dumps(
                        {
                            "status": "error",
                            "progress": 0,
                            "message": "Advanced analysis modes require a Pro subscription",
                        }
                    )
                    yield f"data: {error_msg}\n\n"
                return StreamingResponse(auth_error_stream(), media_type="text/plain")
            effective_mode = "fast"
    except Exception as e_outer:
        error_message = f"File processing failed: {str(e_outer)}"
        async def file_error_stream():
            error_msg = json.dumps(
                {
                    "status": "error",
                    "progress": 0,
                    "message": error_message,
                }
            )
            yield f"data: {error_msg}\n\n"
        return StreamingResponse(file_error_stream(), media_type="text/plain")
    # Now create the streaming response with extracted text (no file operations in async context)
    async def generate_stream() -> AsyncGenerator[str, None]:
        """Produce Server-Sent-Event formatted chunks by driving analyze_policy_stream

        analyze_policy_stream is an async function that returns a dict result and reports
        progress via an async progress callback. We create an asyncio.Queue and a
        progress_cb that pushes events into the queue. We then schedule the analysis
        as a background task and yield events from the queue as they arrive.
        """
        q: asyncio.Queue = asyncio.Queue()

        async def progress_cb(event_name: str, data: dict):
            # Normalize event payload and put into queue
            try:
                await q.put({"event": event_name, "data": data})
            except asyncio.CancelledError:
                raise
            except Exception as e:
                # If putting into the queue fails, log and put an error event
                logging.exception("progress_cb failed: %s", e)
                try:
                    await q.put({"event": "error", "data": {"message": str(e)}})
                except Exception:
                    pass

        # Helper to format and yield JSON SSE messages
        async def _yield_from_queue():
            while True:
                item = await q.get()
                if item is None:
                    break
                try:
                    payload = json.dumps(item)
                except Exception:
                    payload = json.dumps({"event": "error", "data": {"message": "Serialization error"}})
                yield f"data: {payload}\n\n"
                # Stop if the analysis completed or errored
                ev = item.get("event")
                if ev in {"completed", "error"}:
                    break

        # Start analysis in background and stream queue items
        task = None
        try:
            task = asyncio.create_task(
                analyze_policy_stream(text, analysis_mode=effective_mode, progress_cb=progress_cb)
            )

            # Iterate over queue yields
            async for s in _yield_from_queue():
                yield s

            # Ensure analysis task completed and capture result
            result = None
            try:
                result = await task
            except Exception as e:
                # Emit error event
                err = {"event": "error", "data": {"message": f"Analysis failed: {str(e)}"}}
                try:
                    yield f"data: {json.dumps(err)}\n\n"
                except Exception:
                    yield f"data: {json.dumps({'event': 'error', 'data': {'message': 'Unknown analysis failure'}})}\n\n"
                return

            # Emit completed if not already emitted
            try:
                await q.put({"event": "completed", "data": result})
                payload = json.dumps({"event": "completed", "data": result})
                yield f"data: {payload}\n\n"
            except Exception:
                pass

            # Optionally ingest the file and emit events
            if ingest:
                try:
                    await q.put({"event": "ingest_started", "data": {}})
                    from ....rag.service import ingest_paths

                    stats = ingest_paths([str(temp_file)])
                    await q.put({"event": "ingest_completed", "data": stats})
                except Exception as e:
                    await q.put({"event": "ingest_failed", "data": {"message": str(e)}})

            # Optionally generate report and emit events
            if generate_report:
                try:
                    await q.put({"event": "report_started", "data": {}})
                    md_lines = [f"# Compliance Report\n", f"**Verdict:** {result.get('verdict')}\n", f"**Score:** {result.get('score')}\n", f"**Summary:** {result.get('summary')}\n\n", "## Findings\n"]
                    for f in result.get('findings', []):
                        md_lines.append(f"- {f.get('article')}: {f.get('issue')}\n")
                    md = "\n".join(md_lines)
                    rp = export_report(md, out_dir=get_settings().reports_dir)
                    await q.put({"event": "report_completed", "data": {"path": rp}})
                except Exception as e:
                    await q.put({"event": "report_failed", "data": {"message": str(e)}})
        finally:
            # Attempt to cancel the background task if it's still running
            if task and not task.done():
                try:
                    task.cancel()
                except Exception:
                    pass
    return StreamingResponse(
        generate_stream(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream",
        },
    )
