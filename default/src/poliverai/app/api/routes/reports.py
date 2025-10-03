from datetime import datetime
from pathlib import Path
from typing import Any
import os

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

from ....core.config import get_settings
from ....rag.service import _init
from ....reporting.exporter import export_report
from ....storage.gcs_reports import upload_report_if_changed, compute_sha256_for_file
from ....db.mongo import MongoUserDB
from fastapi import Header, Request, Depends
from .auth import CURRENT_USER_DEPENDENCY
from .verification import CURRENT_USER_OPTIONAL_DEPENDENCY
from ....domain.auth import User
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
            if gcs_bucket and user_id:
                object_path = f"{user_id}/{filename}"
                uploaded, gcs_url = upload_report_if_changed(gcs_bucket, object_path, filepath)
        except Exception:
            gcs_url = None

        # Insert a record into Mongo 'reports' collection if available
        try:
            mongo_uri = os.getenv("MONGO_URI")
            if mongo_uri:
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
                    "file_size": file_size,
                    "created_at": datetime.utcnow(),
                }
                mdb.db.get_collection("reports").insert_one(report_doc)
        except Exception:
            # Do not hard-fail report creation if DB logging fails
            pass

        return ReportResponse(
            filename=filename, path=filepath, download_url=gcs_url or f"/api/v1/reports/download/{filename}"
        )
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

    return FileResponse(path=str(filepath), filename=filename, media_type=media_type)


@router.get("/user-reports")
async def list_user_reports(current_user: User = CURRENT_USER_DEPENDENCY):
    """List reports for the authenticated user."""
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        raise HTTPException(status_code=500, detail="MongoDB not configured")

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
                }
            )
        return out
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list reports: {e}") from e
