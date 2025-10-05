from datetime import datetime
from pathlib import Path
from typing import Any
import os

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from ....core.config import get_settings
from ....rag.service import _init
from ....reporting.exporter import export_report
try:
    from ....storage.gcs_reports import upload_report_if_changed, compute_sha256_for_file
    from ....storage.gcs_reports import delete_object
except Exception:  # pragma: no cover - optional dependency
    upload_report_if_changed = None
    compute_sha256_for_file = None

try:
    from ....db.mongo import MongoUserDB
except Exception:  # pragma: no cover - optional dependency
    MongoUserDB = None
from fastapi import Header, Request, Depends
from .auth import CURRENT_USER_DEPENDENCY
from .verification import CURRENT_USER_OPTIONAL_DEPENDENCY
from ....domain.auth import User, UserTier
import os
import stat

# Constants
MAX_EXCERPT_LENGTH = 150
MAX_EVIDENCE_EXCERPT_LENGTH = 200
MAX_ARTICLE_DISPLAY_LENGTH = 100
MAX_RECOMMENDATIONS_IN_REVISION = 5


class ReportRequest(BaseModel):
    content: str
    format: str = "pdf"  # or "markdown"
    title: str | None = "Compliance Report"


class VerificationReportRequest(BaseModel):
    """Request model for generating verification reports with full data."""

    verdict: str
    score: int
    confidence: float
    findings: list[dict[str, Any]]
    recommendations: list[dict[str, Any]]
    evidence: list[dict[str, Any]]
    metrics: dict[str, Any]
    analysis_mode: str = "balanced"
    document_name: str | None = "Policy Document"


class PolicyRevisionRequest(BaseModel):
    """Request model for generating revised policy documents."""

    original_document: str
    findings: list[dict[str, Any]]
    recommendations: list[dict[str, Any]]
    evidence: list[dict[str, Any]]
    document_name: str | None = "Policy Document"
    revision_mode: str = "comprehensive"  # comprehensive, minimal, or targeted


class ReportResponse(BaseModel):
    filename: str
    path: str
    download_url: str


router = APIRouter(tags=["reports"])


def _generate_verification_report_content(req: VerificationReportRequest) -> str:
    """Generate comprehensive verification report content."""
    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

    # Categorize findings by severity
    high_severity = [f for f in req.findings if f.get("severity") == "high"]
    medium_severity = [f for f in req.findings if f.get("severity") == "medium"]
    low_severity = [f for f in req.findings if f.get("severity") == "low"]

    # Identify strengths (evidence that fulfills requirements)
    strengths = [e for e in req.evidence if e.get("verdict") == "fulfills"]

    verdict_emoji = {"compliant": "✅", "partially_compliant": "⚠️", "non_compliant": "❌"}.get(
        req.verdict, "❓"
    )

    content = f"""
# GDPR Compliance Verification Report

**Document:** {req.document_name}
**Generated:** {timestamp}
**Analysis Mode:** {req.analysis_mode.title()}

---

## Executive Summary

**Compliance Verdict:** {verdict_emoji} {req.verdict.replace("_", " ").title()}
**Overall Score:** {req.score}/100
**Analysis Confidence:** {req.confidence:.1%}

### Key Metrics
- Total Issues Identified: {len(req.findings)}
- Critical Issues: {len(high_severity)}
- Moderate Issues: {len(medium_severity)}
- Minor Issues: {len(low_severity)}
- Requirements Met: {req.metrics.get("total_fulfills", 0)}
- Critical Areas: {req.metrics.get("critical_violations", 0)}

---

## Document Strengths
"""

    if strengths:
        content += "\n**Compliant Provisions:**\n"
        for i, strength in enumerate(strengths[:5], 1):
            article = strength.get("article", "Unknown")[:MAX_ARTICLE_DISPLAY_LENGTH]
            excerpt = strength.get("policy_excerpt", "")[:MAX_EXCERPT_LENGTH]
            policy_excerpt = strength.get("policy_excerpt", "")
            truncate_marker = "..." if len(policy_excerpt) > MAX_EXCERPT_LENGTH else ""
            content += f"{i}. **{article}**: {excerpt}{truncate_marker}\n\n"
    else:
        content += (
            "\nLimited compliant provisions identified. Consider reviewing policy structure.\n"
        )

    content += "\n---\n\n## Compliance Issues\n"

    if high_severity:
        content += "\n### 🔴 Critical Issues (Immediate Action Required)\n\n"
        for i, finding in enumerate(high_severity, 1):
            article = finding.get("article", "Unknown")
            issue = finding.get("issue", "No description")
            confidence = finding.get("confidence", 0.0)
            issue_text = (
                f"{i}. **{article}**\n   - Issue: {issue}\n   - Confidence: {confidence:.1%}\n\n"
            )
            content += issue_text

    if medium_severity:
        content += "\n### 🟡 Moderate Issues (Should Address Soon)\n\n"
        for i, finding in enumerate(medium_severity, 1):
            article = finding.get("article", "Unknown")
            issue = finding.get("issue", "No description")
            confidence = finding.get("confidence", 0.0)
            issue_text = (
                f"{i}. **{article}**\n   - Issue: {issue}\n   - Confidence: {confidence:.1%}\n\n"
            )
            content += issue_text

    if low_severity:
        content += "\n### 🟢 Minor Issues (Low Priority)\n\n"
        for i, finding in enumerate(low_severity, 1):
            article = finding.get("article", "Unknown")
            issue = finding.get("issue", "No description")
            content += f"{i}. **{article}**: {issue}\n\n"

    if not req.findings:
        content += "\n✅ No compliance issues detected.\n"

    content += "\n---\n\n## Recommendations\n\n"

    if req.recommendations:
        content += "**Action Items:**\n\n"
        for i, rec in enumerate(req.recommendations, 1):
            article = rec.get("article", "Unknown")
            suggestion = rec.get("suggestion", "No suggestion provided")
            content += f"{i}. **{article}**: {suggestion}\n\n"
    else:
        content += "No specific recommendations at this time.\n"

    # Add detailed findings section
    content += "\n---\n\n## Detailed Findings\n\n"

    if req.findings:
        content += (
            "This section provides comprehensive details about all "
            "identified compliance issues.\n\n"
        )

        # Group findings by severity for better organization
        findings_by_severity = {
            "high": [f for f in req.findings if f.get("severity") == "high"],
            "medium": [f for f in req.findings if f.get("severity") == "medium"],
            "low": [f for f in req.findings if f.get("severity") == "low"],
        }

        for severity, severity_findings in findings_by_severity.items():
            if not severity_findings:
                continue

            severity_emoji = {"high": "🔴", "medium": "🟡", "low": "🟢"}
            severity_label = {"high": "Critical", "medium": "Moderate", "low": "Minor"}

            severity_header = (
                f"### {severity_emoji[severity]} {severity_label[severity]} Severity Issues\n\n"
            )
            content += severity_header

            for i, finding in enumerate(severity_findings, 1):
                article = finding.get("article", "Unknown")
                issue = finding.get("issue", "No description")
                confidence = finding.get("confidence", 0.0)

                content += f"**{i}. {article}**\n"
                content += f"- **Issue:** {issue}\n"
                content += f"- **Confidence:** {confidence:.1%}\n"
                content += f"- **Severity:** {severity_label[severity]}\n\n"
    else:
        content += "No detailed findings to report - policy appears to be compliant.\n\n"

    # Add evidence section
    content += "\n---\n\n## Supporting Evidence\n\n"

    if req.evidence:
        content += (
            "This section shows the specific policy excerpts that were analyzed "
            "and their compliance status.\n\n"
        )

        # Separate evidence by verdict
        violations = [e for e in req.evidence if e.get("verdict") == "violates"]
        fulfills = [e for e in req.evidence if e.get("verdict") == "fulfills"]
        unclear = [e for e in req.evidence if e.get("verdict") == "unclear"]

        if violations:
            content += "### ❌ Policy Violations\n\n"
            for i, evidence in enumerate(violations, 1):
                article = evidence.get("article", "Unknown")
                excerpt = evidence.get("policy_excerpt", "")[:MAX_EVIDENCE_EXCERPT_LENGTH]
                score = evidence.get("score", 0.0)
                rationale = evidence.get("rationale", "No rationale provided")
                policy_excerpt = evidence.get("policy_excerpt", "")
                truncate_marker = "..." if len(policy_excerpt) > MAX_EVIDENCE_EXCERPT_LENGTH else ""

                content += f"**{i}. {article}** (Score: {score:.2f})\n"
                content += f'- **Policy Excerpt:** "{excerpt}{truncate_marker}"\n'
                content += f"- **Analysis:** {rationale}\n\n"

        if fulfills:
            content += "### ✅ Compliant Provisions\n\n"
            for i, evidence in enumerate(fulfills, 1):
                article = evidence.get("article", "Unknown")
                excerpt = evidence.get("policy_excerpt", "")[:MAX_EVIDENCE_EXCERPT_LENGTH]
                score = evidence.get("score", 0.0)
                rationale = evidence.get("rationale", "No rationale provided")
                policy_excerpt = evidence.get("policy_excerpt", "")
                truncate_marker = "..." if len(policy_excerpt) > MAX_EVIDENCE_EXCERPT_LENGTH else ""

                content += f"**{i}. {article}** (Score: {score:.2f})\n"
                content += f'- **Policy Excerpt:** "{excerpt}{truncate_marker}"\n'
                content += f"- **Analysis:** {rationale}\n\n"

        if unclear:
            content += "### ❓ Unclear Provisions\n\n"
            for i, evidence in enumerate(unclear, 1):
                article = evidence.get("article", "Unknown")
                excerpt = evidence.get("policy_excerpt", "")[:MAX_EVIDENCE_EXCERPT_LENGTH]
                score = evidence.get("score", 0.0)
                rationale = evidence.get("rationale", "No rationale provided")
                policy_excerpt = evidence.get("policy_excerpt", "")
                truncate_marker = "..." if len(policy_excerpt) > MAX_EVIDENCE_EXCERPT_LENGTH else ""

                content += f"**{i}. {article}** (Score: {score:.2f})\n"
                content += f'- **Policy Excerpt:** "{excerpt}{truncate_marker}"\n'
                content += f"- **Analysis:** {rationale}\n\n"
    else:
        content += "No supporting evidence available for this analysis.\n\n"

    # Next steps based on verdict
    content += "\n---\n\n## Next Steps\n\n"
    if req.verdict == "compliant":
        content += (
            "- Continue regular compliance monitoring\n"
            "- Update policy as regulations evolve\n"
            "- Conduct periodic reviews\n"
        )
    elif req.verdict == "partially_compliant":
        content += (
            "- Address identified gaps, prioritizing critical issues\n"
            "- Consider legal review for moderate issues\n"
            "- Implement recommended changes\n"
            "- Re-verify after updates\n"
        )
    else:
        content += (
            "- Immediate policy revision required\n"
            "- Consult GDPR legal expert\n"
            "- Address all critical issues\n"
            "- Complete re-verification\n"
        )

    # Add methodology section
    content += "\n---\n\n## Methodology & Analysis Details\n\n"

    if req.analysis_mode == "fast":
        content += (
            "**Analysis Mode:** Fast Mode\n\n"
            "This report was generated using rule-based GDPR compliance checks "
            "for rapid assessment. The analysis focuses on identifying obvious "
            "compliance gaps through pattern matching and keyword detection "
            "against known GDPR requirements.\n\n"
            "**Key Features:**\n"
            "- Lightning fast analysis (< 1 second)\n"
            "- Rule-based compliance pattern detection\n"
            "- Suitable for initial screening and bulk processing\n"
            "- May miss nuanced violations requiring contextual understanding\n\n"
            "**Recommendation:** For production compliance verification, "
            "consider using Balanced mode for more thorough analysis "
            "of sensitive clauses.\n"
        )
    elif req.analysis_mode == "balanced":
        content += (
            "**Analysis Mode:** Balanced Mode (Recommended)\n\n"
            "This report combines rule-based checks with selective AI analysis "
            "on sensitive clauses. The system identifies privacy-sensitive content "
            "and applies advanced language models for nuanced compliance evaluation.\n\n"
            "**Key Features:**\n"
            "- Smart AI analysis focused on sensitive clauses\n"
            "- Detects nuanced violations like automatic data collection\n"
            "- Optimal balance of accuracy and performance (~30-60 seconds)\n"
            "- Recommended for production compliance verification\n\n"
            "**Analysis Process:**\n"
            "1. Rule-based baseline assessment\n"
            "2. Identification of privacy-sensitive clauses\n"
            "3. AI-powered analysis of sensitive content\n"
            "4. Hybrid scoring combining rule-based and AI insights\n"
        )
    elif req.analysis_mode == "detailed":
        content += (
            "**Analysis Mode:** Detailed Mode\n\n"
            "This report provides the most comprehensive analysis using AI-powered evaluation "
            "of all substantial policy clauses. Every meaningful section is analyzed for "
            "GDPR compliance with maximum accuracy.\n\n"
            "**Key Features:**\n"
            "- Full AI analysis of all substantial clauses\n"
            "- Maximum accuracy and comprehensive coverage\n"
            "- Detailed contextual understanding\n"
            "- Suitable for legal review and research (~30-60 seconds)\n\n"
            "**Analysis Process:**\n"
            "1. Rule-based baseline assessment\n"
            "2. Comprehensive clause segmentation\n"
            "3. AI-powered analysis of all meaningful sections\n"
            "4. Detailed compliance scoring with confidence metrics\n"
        )

    content += "\n**Compliance Framework:** General Data Protection Regulation (EU) 2016/679\n"
    content += "**Analysis Engine:** PoliverAI GDPR Verification System\n"
    content += f"**Document Analyzed:** {req.document_name}\n"

    report_footer = (
        f"\n---\n\n*Report generated by PoliverAI using {req.analysis_mode} "
        f"analysis mode on {timestamp}*\n"
    )
    content += report_footer

    return content


def _generate_revised_policy(req: PolicyRevisionRequest) -> str:
    """Generate a revised policy document addressing compliance issues."""
    settings = get_settings()

    if not settings.openai_api_key:
        raise HTTPException(
            status_code=400, detail="AI revision requires OpenAI API key configuration"
        )

    # Prepare revision instructions based on findings
    critical_issues = [f for f in req.findings if f.get("severity") == "high"]
    moderate_issues = [f for f in req.findings if f.get("severity") == "medium"]

    # Build detailed revision instructions
    revision_instructions = (
        "Please revise this privacy policy to address the following GDPR compliance issues:\n\n"
    )

    if critical_issues:
        revision_instructions += "CRITICAL ISSUES (must fix):\n"
        for i, issue in enumerate(critical_issues, 1):
            article = issue.get("article", "Unknown")
            problem = issue.get("issue", "No description")
            revision_instructions += f"{i}. {article}: {problem}\n"

    if moderate_issues:
        revision_instructions += "\nMODERATE ISSUES (should fix):\n"
        for i, issue in enumerate(moderate_issues, 1):
            article = issue.get("article", "Unknown")
            problem = issue.get("issue", "No description")
            revision_instructions += f"{i}. {article}: {problem}\n"

    # Add recommendations as guidance
    if req.recommendations:
        revision_instructions += "\nRECOMMENDED IMPROVEMENTS:\n"
        for i, rec in enumerate(req.recommendations[:MAX_RECOMMENDATIONS_IN_REVISION], 1):
            article = rec.get("article", "Unknown")
            suggestion = rec.get("suggestion", "No suggestion")
            revision_instructions += f"{i}. {article}: {suggestion}\n"

    revision_instructions += """

Revision Guidelines:
- Maintain the original structure and tone
- Only modify sections that need GDPR compliance fixes
- Add missing required information clearly
- Ensure legal language is precise
- Keep the policy readable for end users
- Add section headers if needed for clarity

Provide the complete revised policy document below:
"""

    # Use OpenAI to generate the revision
    init = _init()

    messages = [
        {
            "role": "system",
            "content": (
                "You are a GDPR compliance expert specializing in privacy policy revision. "
                "Create compliant, professional privacy policies that address specific "
                "compliance issues while maintaining readability."
            ),
        },
        {
            "role": "user",
            "content": (
                f"{revision_instructions}\n\nORIGINAL POLICY DOCUMENT:\n{req.original_document}"
            ),
        },
    ]

    try:
        response = init.client.chat.completions.create(
            model=settings.openai_chat_model,
            messages=messages,
            temperature=0.1,  # Low temperature for consistency
            max_tokens=4000,  # Allow for substantial revisions
            timeout=60,  # Allow time for complex revisions
        )

        revised_policy = response.choices[0].message.content or ""

        if not revised_policy.strip():
            raise Exception("AI generated empty revision")

        return revised_policy.strip()

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to generate policy revision: {str(e)}"
        ) from e


@router.post("/reports", response_model=ReportResponse)
async def generate_report(req: ReportRequest) -> ReportResponse:
    """Generate a simple report from content."""
    try:
        reports_dir = Path("reports")
        reports_dir.mkdir(parents=True, exist_ok=True)
        ts = datetime.utcnow().strftime("%Y%m%d-%H%M%S")

        if req.format.lower() == "pdf":
            filename = f"compliance-report-{ts}.pdf"
            filepath = reports_dir / filename
            export_report(req.content, str(reports_dir))
            # The export_report function generates the filename, so we need to find it
            generated_files = list(reports_dir.glob(f"compliance-report-{ts[:8]}*.pdf"))
            if generated_files:
                filepath = generated_files[0]
                filename = filepath.name
        else:
            filename = f"compliance-report-{ts}.md"
            filepath = reports_dir / filename
            filepath.write_text(req.content)

        # Charge credits for report generation (non-PRO users)
        try:
            from ....db.users import user_db
            from ....db.transactions import transactions
            COSTS = {'report': 10}
            # No current_user dependency here (this endpoint may be used server-side)
            # If we can infer a default user from environment, we could charge; skip otherwise
            # For explicit user-charged report generation, use /verification-report which has user context
            usd = round(COSTS['report'] / 10.0, 2)
            # We don't deduct here unless user context is provided; just return the report
        except Exception:
            pass

        return ReportResponse(
            filename=filename,
            path=str(filepath),
            download_url=f"/api/v1/reports/download/{filename}",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}") from e


@router.post("/verification-report", response_model=ReportResponse)
async def generate_verification_report(
    req: VerificationReportRequest,
    current_user: User | None = CURRENT_USER_OPTIONAL_DEPENDENCY,
) -> ReportResponse:
    """Generate a comprehensive verification report."""
    try:
        reports_dir = Path("reports")
        reports_dir.mkdir(parents=True, exist_ok=True)
        ts = datetime.utcnow().strftime("%Y%m%d-%H%M%S")

        # Charge credits for verification report generation (do it before
        # generating the report to avoid doing heavy work and then failing
        # at the charge step). If charging succeeds we will record a
        # transaction. If generation later fails we attempt a refund.
        from ....db.users import user_db
        from ....db.transactions import transactions

        COST = 5
        charged = False
        try:
            if current_user is None:
                raise HTTPException(status_code=401, detail='Authentication required to generate a charged verification report')

            user_record = user_db.get_user_by_id(current_user.id)
            if not user_record or (user_record.credits or 0) < COST:
                raise HTTPException(status_code=402, detail='Insufficient credits to generate full verification report')

            deducted = False
            try:
                deducted = user_db.update_user_credits(current_user.id, -int(COST))
            except Exception:
                deducted = False

            if not deducted and MongoUserDB:
                try:
                    mdb_try = MongoUserDB(os.getenv('MONGO_URI'))
                    deducted = mdb_try.update_user_credits(current_user.id, -int(COST))
                except Exception:
                    deducted = False

            if not deducted:
                raise HTTPException(status_code=500, detail='Failed to deduct credits for report generation')

            usd = round(COST / 10.0, 2)
            tx = {
                'user_email': current_user.email,
                'event_type': 'charge_report',
                'amount_usd': -usd,
                'credits': -int(COST),
                'description': f'Charge: {int(COST)} credits for full verification report generation',
                'timestamp': datetime.utcnow(),
            }
            try:
                transactions.add(tx)
                charged = True
            except Exception:
                import logging

                logging.exception('Failed to record transaction for pre-charge of report generation')
        except HTTPException:
            # Propagate auth/insufficient errors before doing heavy work
            raise
        except Exception:
            import logging

            logging.exception('Unexpected error while attempting to pre-charge for verification report')
            raise HTTPException(status_code=500, detail='Failed to charge for verification report')

        try:
            # Generate report content
            content = _generate_verification_report_content(req)

            # Export as PDF
            filename = f"gdpr-verification-{ts}.pdf"
            filepath = export_report(content, str(reports_dir))
            filename = Path(filepath).name

            # If GCS is configured, upload under user folder if we have a user id
            settings = get_settings()
            gcs_bucket = settings.reports_gcs_bucket or settings.gcs_bucket or os.getenv("POLIVERAI_REPORTS_GCS_BUCKET")
            user_id = None
            if current_user is not None:
                user_id = current_user.id
            else:
                # fallback to environment variable for backward compatibility
                user_id = os.getenv("POLIVERAI_DEFAULT_USER_ID")

            gcs_url = None
            try:
                if gcs_bucket and user_id and upload_report_if_changed:
                    object_path = f"{user_id}/{filename}"
                    uploaded, gcs_url = upload_report_if_changed(gcs_bucket, object_path, filepath)
            except Exception:
                # Log upload errors so we can diagnose why GCS upload failed
                import logging

                logging.exception('Failed to upload report to GCS')
                gcs_url = None

            # Insert a record into Mongo 'reports' collection if available
            # Prepare placeholders in case Mongo persistence fails so later
            # logic that references these variables doesn't raise UnboundLocalError.
            mdb = None
            inserted_id = None
            try:
                mongo_uri = os.getenv("MONGO_URI")
                if mongo_uri and MongoUserDB:
                    mdb = MongoUserDB(mongo_uri)
                    # collect additional metadata
                    file_size = None
                    try:
                        file_size = Path(filepath).stat().st_size
                    except Exception:
                        file_size = None

                    report_doc = {
                        "filename": filename,
                        "path": str(filepath),
                        "gcs_url": gcs_url,
                        "user_id": user_id,
                        "document_name": req.document_name,
                        "analysis_mode": req.analysis_mode,
                        # mark generated verification reports as full reports so we
                        # don't double-charge if the user later clicks Save
                        "is_full_report": True,
                        # numeric compliance score reported by the verification step
                        "score": getattr(req, 'score', None),
                        # persist the raw generated content so it can be rendered
                        # inline later by the frontend (detailed view)
                        "content": content,
                        # store verdict and a simple type so the frontend can filter
                        "verdict": getattr(req, 'verdict', None),
                        "type": "verification",
                        "file_size": file_size,
                        "created_at": datetime.utcnow(),
                    }
                    inserted = mdb.db.get_collection("reports").insert_one(report_doc)
                    inserted_id = inserted.inserted_id
            except Exception:
                # Do not hard-fail report creation if DB logging fails, but log details
                import logging

                logging.exception('Failed to persist verification report record to Mongo')

            # If we successfully pre-charged earlier, mark the report doc as charged
            try:
                if charged and mdb is not None and inserted_id is not None:
                    mdb.db.get_collection('reports').update_one({'_id': inserted_id}, {'$set': {'charged': True}})
            except Exception:
                # don't block the response if marking charged fails
                pass

            return ReportResponse(
                filename=filename, path=filepath, download_url=gcs_url or f"/api/v1/reports/download/{filename}"
            )
        except HTTPException:
            # propagate known HTTP errors without trying to refund (they
            # indicate client-side issues like 402/401)
            raise
        except Exception as e:
            # If we charged the user but generation/persistence failed, try to refund
            try:
                if charged and current_user is not None:
                    try:
                        user_db.update_user_credits(current_user.id, int(COST))
                    except Exception:
                        if MongoUserDB:
                            try:
                                mdb_rf = MongoUserDB(os.getenv('MONGO_URI'))
                                mdb_rf.update_user_credits(current_user.id, int(COST))
                            except Exception:
                                pass
                    try:
                        refund_tx = {
                            'user_email': current_user.email,
                            'event_type': 'refund_report_generation',
                            'amount_usd': round(COST/10.0, 2),
                            'credits': int(COST),
                            'description': 'Refund: failed verification report generation',
                            'timestamp': datetime.utcnow(),
                        }
                        transactions.add(refund_tx)
                    except Exception:
                        pass
            except Exception:
                pass
            raise HTTPException(status_code=500, detail=f'Failed to generate verification report: {e}') from e
    except HTTPException:
        # Propagate HTTPExceptions (e.g., 402 Insufficient credits)
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to generate verification report: {str(e)}"
        ) from e


@router.post("/generate-revision", response_model=ReportResponse)
async def generate_policy_revision(req: PolicyRevisionRequest) -> ReportResponse:
    """Generate a revised policy document that addresses compliance issues."""
    try:
        # Generate the revised policy
        revised_policy = _generate_revised_policy(req)

        # Save the revised policy
        reports_dir = Path("reports")
        reports_dir.mkdir(parents=True, exist_ok=True)
        ts = datetime.utcnow().strftime("%Y%m%d-%H%M%S")

        # Clean document name for filename
        clean_name = "".join(
            c for c in req.document_name if c.isalnum() or c in (" ", "-", "_")
        ).rstrip()
        clean_name = clean_name.replace(" ", "-") if clean_name else "policy"

        filename = f"revised-{clean_name}-{ts}.txt"
        filepath = reports_dir / filename

        # Add header to revised document
        header = f"""
# REVISED PRIVACY POLICY
# Generated: {datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")}
# Original: {req.document_name}
# Revision Mode: {req.revision_mode}
# Generated by: PoliverAI GDPR Compliance System

---

"""

        full_content = header + revised_policy
        filepath.write_text(full_content, encoding="utf-8")

        return ReportResponse(
            filename=filename,
            path=str(filepath),
            download_url=f"/api/v1/reports/download/{filename}",
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to generate revised policy: {str(e)}"
        ) from e


@router.get("/reports/download/{filename}")
async def download_report(filename: str):
    """Download a generated report file."""
    reports_dir = Path("reports")
    filepath = reports_dir / filename

    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Report not found")

    # Determine media type based on file extension
    media_type = "application/pdf" if filename.endswith(".pdf") else "text/plain"

    # Serve inline so it can be rendered inside an iframe/modal in the UI.
    headers = {"Content-Disposition": f'inline; filename="{filename}"'}
    return FileResponse(path=str(filepath), filename=filename, media_type=media_type, headers=headers)


@router.get("/user-reports")
async def list_user_reports(
    current_user: User = CURRENT_USER_DEPENDENCY,
    page: int | None = None,
    limit: int | None = None,
) :
    """List reports for the authenticated user.

    If `page` and `limit` query params are provided the endpoint will return a
    paginated response with metadata. If not provided it returns a plain list
    (for backwards compatibility with existing callers).
    """
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri or not MongoUserDB:
        # Dev fallback: no persistent reports available; return empty list
        return []

    try:
        mdb = MongoUserDB(mongo_uri)
        cursor = mdb.db.get_collection("reports").find({"user_id": current_user.id}).sort(
            "created_at", -1
        )
        out = []
        for doc in cursor:
            out.append(
                {
                    "filename": doc.get("filename"),
                    "title": doc.get("document_name"),
                    "created_at": doc.get("created_at").isoformat()
                    if isinstance(doc.get("created_at"), datetime)
                    else str(doc.get("created_at")),
                    "file_size": doc.get("file_size"),
                    "gcs_url": doc.get("gcs_url"),
                        "path": doc.get("path"),
                        # expose verdict and whether this is a full saved report so
                        # the frontend can filter by verdict or full/quick reports
                        "verdict": doc.get("verdict"),
                        "score": doc.get("score"),
                        "is_full_report": bool(doc.get("is_full_report")),
                        "analysis_mode": doc.get("analysis_mode"),
                }
            )

        total = len(out)
        # If pagination params not provided, return raw list for compatibility
        if page is None or limit is None:
            return out

        # sanitize page/limit
        if page < 1:
            page = 1
        if limit < 1:
            limit = total or 1

        total_pages = max(1, (total + limit - 1) // limit)
        start = (page - 1) * limit
        end = start + limit
        paged = out[start:end]

        return JSONResponse({
            "reports": paged,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages,
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list reports: {e}") from e



@router.get("/reports/verdicts")
async def list_verdicts():
    """Return a list of verdict strings the backend understands for UI drop-downs.

    This is intentionally permissive and returns common verdict labels used
    across verification and reporting code paths so the frontend can render
    consistent filter options.
    """
    # Base set - keep in sync with domain enums and places where verdict strings are used
    verdicts = [
        "compliant",
        "partially_compliant",
        "non_compliant",
        "fulfills",
        "violates",
        "unclear",
    ]
    return {"verdicts": verdicts}


@router.get('/reports/detailed/{filename}')
async def get_detailed_report(filename: str, current_user: User = CURRENT_USER_DEPENDENCY):
    """Return the stored detailed report content (markdown/plain) for a saved/generated report.

    This endpoint is intended for the frontend viewer modal to fetch the rich
    textual content of a verification report without requiring a GCS signed URL
    or binary download. It first attempts to read a `content` field from the
    Mongo document; if not present, it falls back to reading a local .md/.txt
    file in the reports directory.
    """
    mongo_uri = os.getenv('MONGO_URI')
    # If no Mongo configured, fallback to file system only
    content = None
    try:
        if mongo_uri and MongoUserDB:
            mdb = MongoUserDB(mongo_uri)
            coll = mdb.db.get_collection('reports')
            doc = coll.find_one({'user_id': current_user.id, 'filename': filename})
            if doc:
                # Prefer stored content (generated verification reports)
                content = doc.get('content')
    except Exception:
        # Non-fatal: continue to file fallback
        import logging

        logging.exception('Failed to fetch stored report content from Mongo; falling back to file')

    # File fallback: try .md, .txt, or any file with the filename
    if not content:
        try:
            reports_dir = Path('reports')
            candidates = [reports_dir / filename, reports_dir / f"{filename}.md", reports_dir / f"{filename}.txt"]
            for cand in candidates:
                if cand.exists():
                    try:
                        content = cand.read_text(encoding='utf-8', errors='ignore')
                        break
                    except Exception:
                        continue
        except Exception:
            pass

    if not content:
        raise HTTPException(status_code=404, detail='Detailed report content not found')

    # Return as plain text so the frontend can render into an iframe or markdown viewer
    return JSONResponse({'filename': filename, 'content': content})


@router.delete("/reports/{filename}")
async def delete_user_report(filename: str, current_user: User = CURRENT_USER_DEPENDENCY):
    """Delete a saved report for the current user. Removes DB record and
    deletes the object from GCS if present. Returns 204 on success."""
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri or not MongoUserDB:
        # Nothing to delete in dev fallback
        raise HTTPException(status_code=404, detail="No persistent report storage configured")

    try:
        mdb = MongoUserDB(mongo_uri)
        coll = mdb.db.get_collection("reports")
        doc = coll.find_one({"user_id": current_user.id, "filename": filename})
        if not doc:
            raise HTTPException(status_code=404, detail="Report not found")

        # Attempt to delete from GCS if gcs_url exists
        gcs_url = doc.get("gcs_url")
        deleted_from_gcs = False
        if gcs_url:
            # gcs_url expected in form gs://bucket/path
            try:
                if gcs_url.startswith("gs://"):
                    parts = gcs_url[5:].split('/', 1)
                    bucket = parts[0]
                    object_path = parts[1] if len(parts) > 1 else filename
                    deleted_from_gcs = delete_object(bucket, object_path)
            except Exception:
                # log and continue with DB deletion
                import logging

                logging.exception("Failed to delete object from GCS for report %s", filename)

        # Delete DB record
        coll.delete_one({"_id": doc.get("_id")})

        return {"deleted": True, "deleted_from_gcs": bool(deleted_from_gcs)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete report: {e}") from e


class BulkDeleteRequest(BaseModel):
    filenames: list[str]


@router.post("/reports/bulk-delete")
async def bulk_delete_reports(req: BulkDeleteRequest, current_user: User = CURRENT_USER_DEPENDENCY):
    """Delete multiple reports for the current user. Returns per-file deletion status."""
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri or not MongoUserDB:
        raise HTTPException(status_code=404, detail="No persistent report storage configured")

    try:
        import logging
        logging.info("bulk_delete_reports called for user %s with filenames: %s", getattr(current_user, 'id', None), req.filenames)
        mdb = MongoUserDB(mongo_uri)
        coll = mdb.db.get_collection("reports")
        results = []
        for fn in req.filenames:
            logging.info("processing delete for filename=%s", fn)
            doc = coll.find_one({"user_id": current_user.id, "filename": fn})
            if not doc:
                logging.info("report not found for filename=%s", fn)
                results.append({"filename": fn, "deleted": False, "reason": "not_found"})
                continue

            gcs_url = doc.get("gcs_url")
            deleted_from_gcs = False
            if gcs_url and isinstance(gcs_url, str) and gcs_url.startswith("gs://"):
                try:
                    parts = gcs_url[5:].split('/', 1)
                    bucket = parts[0]
                    object_path = parts[1] if len(parts) > 1 else fn
                    deleted_from_gcs = delete_object(bucket, object_path)
                except Exception:
                    deleted_from_gcs = False

            # Remove DB record
            coll.delete_one({"_id": doc.get("_id")})
            logging.info("deleted db record for filename=%s", fn)
            results.append({"filename": fn, "deleted": True, "deleted_from_gcs": bool(deleted_from_gcs)})

        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to bulk delete reports: {e}") from e


@router.get("/user-reports/count")
async def count_user_reports(current_user: User = CURRENT_USER_DEPENDENCY):
    """Return the number of saved reports for the authenticated user."""
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri or not MongoUserDB:
        # Dev fallback: no persistent reports available; return zero
        return {"count": 0}

    try:
        mdb = MongoUserDB(mongo_uri)
        count = mdb.db.get_collection("reports").count_documents({"user_id": current_user.id})
        return {"count": int(count)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to count reports: {e}") from e


class SaveReportRequest(BaseModel):
    filename: str
    document_name: str | None = None
    is_quick: bool | None = None


@router.post("/reports/save", response_model=ReportResponse)
async def save_report(
    req: SaveReportRequest, current_user: User = CURRENT_USER_DEPENDENCY
) -> ReportResponse:
    """Persist an existing generated report file: upload to GCS (if configured) and insert a DB record."""
    try:
        reports_dir = Path("reports")
        filepath = reports_dir / req.filename

        if not filepath.exists():
            raise HTTPException(status_code=404, detail="Report file not found")

        # Try upload to GCS if available
        settings = get_settings()
        gcs_bucket = settings.reports_gcs_bucket or settings.gcs_bucket or os.getenv("POLIVERAI_REPORTS_GCS_BUCKET")
        gcs_url = None
        try:
            if gcs_bucket and current_user and upload_report_if_changed:
                object_path = f"{current_user.id}/{req.filename}"
                uploaded, gcs_url = upload_report_if_changed(gcs_bucket, object_path, str(filepath))
        except Exception:
            # don't fail if upload not possible; continue to insert DB record
            import logging

            logging.exception('Failed to upload report to GCS on save')
            gcs_url = None

        # Insert into Mongo 'reports' collection if available
        try:
            import logging
            logger = logging.getLogger(__name__)
            logger.info('save_report called user=%s filename=%s is_quick=%s', getattr(current_user, 'email', None), req.filename, getattr(req, 'is_quick', None))
            mongo_uri = os.getenv("MONGO_URI")
            if mongo_uri and MongoUserDB:
                mdb = MongoUserDB(mongo_uri)
                file_size = None
                try:
                    file_size = filepath.stat().st_size
                except Exception:
                    file_size = None

                coll = mdb.db.get_collection('reports')
                # If a report doc already exists for this user+filename (e.g. a
                # generated verification report was created earlier), update the
                # existing document rather than inserting a duplicate. This also
                # allows us to avoid double-charging if the existing doc is
                # already marked as charged.
                existing = coll.find_one({"user_id": current_user.id, "filename": req.filename})
                report_doc = {
                    "filename": req.filename,
                    "path": str(filepath),
                    "gcs_url": gcs_url,
                    "user_id": current_user.id,
                    "document_name": req.document_name or req.filename,
                    "analysis_mode": "balanced",
                    # quick saves are not full reports
                    "is_full_report": False,
                    # optional numeric compliance score (0-100)
                    "score": None,
                    # try to infer verdict/type from file contents or filename
                    "verdict": None,
                    "type": ("revision" if str(req.filename).startswith("revised-") else ("verification" if "verification" in str(req.filename) or str(req.filename).startswith("gdpr-verification") else "other")),
                    "file_size": file_size,
                    "created_at": datetime.utcnow(),
                }
                # Best-effort: try to extract a verdict string from the report file
                try:
                    txt = filepath.read_text(encoding='utf-8', errors='ignore')
                    # look for markdown-style '**Verdict:**' or 'Verdict:' markers
                    verdict = None
                    for marker in ['**Verdict:**', 'Verdict:']:
                        if marker in txt:
                            # take the rest of the line after the marker
                            for line in txt.splitlines():
                                if marker in line:
                                    verdict = line.split(marker, 1)[1].strip()
                                    break
                        if verdict:
                            break
                    if verdict:
                        # normalize to lowercase keys used elsewhere
                        report_doc['verdict'] = verdict.lower().replace(' ', '_')
                    # try to extract a score (e.g. 'Score: 78%' or 'Score 78')
                    import re
                    score_match = re.search(r"Score\s*[:]?\s*(\d{1,3})(?:\s*%?)", txt, re.IGNORECASE)
                    if score_match:
                        try:
                            s = int(score_match.group(1))
                            report_doc['score'] = max(0, min(100, s))
                        except Exception:
                            pass
                except Exception:
                    # ignore failures reading/parsing file
                    pass
                if existing:
                    # Update fields that may have changed (path, gcs_url, file_size)
                    coll.update_one({"_id": existing.get("_id")}, {"$set": {"path": report_doc['path'], "gcs_url": report_doc['gcs_url'], "file_size": report_doc['file_size'], "created_at": report_doc['created_at']}})
                    inserted_id = existing.get("_id")
                    # use the existing doc mapping for charged state
                    existing_charged = bool(existing.get('charged'))
                else:
                    inserted = coll.insert_one(report_doc)
                    inserted_id = inserted.inserted_id
                    existing_charged = False
                # Charge credits for any report save (quick or full) using a single
                # configurable cost so the frontend can depend on a consistent
                # transaction being recorded. Use a single COST value for now (10
                # credits) and mark the DB record as charged when the transaction
                # is successfully recorded.
                try:
                    from ....db.users import user_db
                    from ....db.transactions import transactions
                    COST_SAVE_CREDITS = 1
                    is_quick_save = bool(getattr(req, 'is_quick', False))

                    # If the user is not PRO, ensure they have enough credits and
                    # deduct the cost. For now we charge the same amount for quick
                    # and full saves; this can be tuned later.
                    # Only attempt to charge if the report hasn't already been
                    # marked as charged (avoid double-charging generated reports)
                    if not existing_charged and current_user:
                        user_record = user_db.get_user_by_id(current_user.id)
                        if not user_record or (user_record.credits or 0) < COST_SAVE_CREDITS:
                            logger.info('Insufficient credits for user=%s to save report: have=%s need=%s', getattr(current_user, 'email', None), getattr(user_record, 'credits', None) if user_record else None, COST_SAVE_CREDITS)
                            raise HTTPException(status_code=402, detail='Insufficient credits to save report')

                        # Deduct credits and record transaction
                        user_db.update_user_credits(current_user.id, -int(COST_SAVE_CREDITS))
                        usd = round(COST_SAVE_CREDITS / 10.0, 2)
                        tx = {
                            'user_email': current_user.email,
                            'event_type': 'saved_compliance_report',
                            'amount_usd': -usd,
                            'credits': -int(COST_SAVE_CREDITS),
                            'description': 'Saved Compliance Report',
                        }
                        try:
                            transactions.add(tx)
                            coll.update_one({'_id': inserted_id}, {'$set': {'charged': True}})
                            logger.info('Recorded transaction for save user=%s filename=%s', getattr(current_user, 'email', None), req.filename)
                        except Exception:
                            logger.exception('Failed to add transaction for save for user=%s filename=%s', getattr(current_user, 'email', None), req.filename)
                    else:
                        # If no authenticated user is present, still record a
                        # non-charging save event for auditability. If the report
                        # was already charged, skip adding a duplicate transaction.
                        if not existing_charged:
                            try:
                                tx = {
                                    'user_email': current_user.email if current_user else None,
                                    'event_type': 'saved_compliance_report',
                                    'amount_usd': 0.0,
                                    'credits': 0,
                                    'description': 'Saved Compliance Report (no charge)',
                                }
                                transactions.add(tx)
                            except Exception:
                                pass
                except Exception:
                    # Don't block save on transient transaction or user_db errors,
                    # but log so we can diagnose charging issues.
                    logger.exception('Error while attempting to charge for saved report')
        except Exception:
            # Swallow DB errors but log them so persistence issues are visible in logs
            import logging

            logging.exception('Failed to persist saved report record to Mongo')

        return ReportResponse(filename=req.filename, path=str(filepath), download_url=gcs_url or f"/api/v1/reports/download/{req.filename}")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save report: {e}") from e
