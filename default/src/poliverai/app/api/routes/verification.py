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
from ....rag.verification import analyze_policy
from ....rag.verification import analyze_policy_stream


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
    current_user: User | None = CURRENT_USER_OPTIONAL_DEPENDENCY,
) -> ComplianceResult:
    # Handle different file types properly

    # Save uploaded file to temporary location
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
        # Clean up temp file
        try:
            temp_file.unlink(missing_ok=True)
            tmpdir.rmdir()
        except Exception as e:
            logging.warning(f"Failed to cleanup temp file: {e}")

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
        try:
            # Stream the analysis process using the pre-extracted text
            async for chunk in analyze_policy_stream(text, analysis_mode=effective_mode):
                yield chunk
        except Exception as e:
            error_msg = json.dumps(
                {"status": "error", "progress": 0, "message": f"Analysis failed: {str(e)}"}
            )
            yield f"data: {error_msg}\n\n"
    return StreamingResponse(
        generate_stream(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream",
        },
    )
