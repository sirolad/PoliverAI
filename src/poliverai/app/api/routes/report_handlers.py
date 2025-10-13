"""Report handlers for processing GDPR compliance report generation requests.

This module contains the business logic for generating various types of
compliance reports and policy revisions.
"""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException

from ....core.config import get_settings
from ....models.api import (
    PolicyRevisionRequest,
    ReportRequest,
    ReportResponse,
    VerificationReportRequest,
)
from ....rag.service import _init
from ....reporting.exporter import export_report
from .report_utils import (
    build_revision_instructions,
    format_evidence_section,
    format_findings_section,
    format_methodology_section,
    format_report_header,
    format_strengths_section,
)

# Constants
MAX_RECOMMENDATIONS_IN_REVISION = 5


def generate_verification_report_content(req: VerificationReportRequest) -> str:
    """Generate comprehensive verification report content."""
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    # Start with header and executive summary
    content = format_report_header(
        req.document_name,
        timestamp,
        req.analysis_mode,
        req.verdict,
        req.score,
        req.confidence,
        req.findings,
        req.metrics,
    )

    # Add document strengths section
    content += format_strengths_section(req.evidence)

    # Add compliance issues section
    content += format_findings_section(req.findings)

    # Add recommendations section
    content += "\\n---\\n\\n## Recommendations\\n\\n"
    if req.recommendations:
        content += "**Action Items:**\\n\\n"
        for i, rec in enumerate(req.recommendations, 1):
            article = rec.get("article", "Unknown")
            suggestion = rec.get("suggestion", "No suggestion provided")
            content += f"{i}. **{article}**: {suggestion}\\n\\n"
    else:
        content += "No specific recommendations at this time.\\n"

    # Add detailed findings section
    content += "\\n---\\n\\n## Detailed Findings\\n\\n"
    if req.findings:
        content += (
            "This section provides comprehensive details about all "
            "identified compliance issues.\\n\\n"
        )
        content += format_findings_section(req.findings, detailed=True)
    else:
        content += "No detailed findings to report - policy appears to be compliant.\\n\\n"

    # Add supporting evidence section
    content += format_evidence_section(req.evidence)

    # Add next steps section
    content += "\\n---\\n\\n## Next Steps\\n\\n"
    if req.verdict == "compliant":
        content += (
            "- Continue regular compliance monitoring\\n"
            "- Update policy as regulations evolve\\n"
            "- Conduct periodic reviews\\n"
        )
    elif req.verdict == "partially_compliant":
        content += (
            "- Address identified gaps, prioritizing critical issues\\n"
            "- Consider legal review for moderate issues\\n"
            "- Implement recommended changes\\n"
            "- Re-verify after updates\\n"
        )
    else:
        content += (
            "- Immediate policy revision required\\n"
            "- Consult GDPR legal expert\\n"
            "- Address all critical issues\\n"
            "- Complete re-verification\\n"
        )

    # Add methodology section
    content += format_methodology_section(req.analysis_mode, req.document_name, timestamp)

    return content


def generate_revised_policy(req: PolicyRevisionRequest) -> str:
    """Generate a revised policy document addressing compliance issues."""
    settings = get_settings()

    if not settings.openai_api_key:
        raise HTTPException(
            status_code=400, detail="AI revision requires OpenAI API key configuration"
        )

    # Build revision instructions
    revision_instructions = build_revision_instructions(req.findings, req.recommendations)

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
                f"{revision_instructions}\\n\\nORIGINAL POLICY DOCUMENT:\\n{req.original_document}"
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


def create_simple_report(req: ReportRequest) -> ReportResponse:
    """Create a simple report from provided content."""
    try:
        reports_dir = Path("reports")
        reports_dir.mkdir(parents=True, exist_ok=True)
        ts = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")

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


def create_verification_report(req: VerificationReportRequest) -> ReportResponse:
    """Create a comprehensive verification report."""
    try:
        reports_dir = Path("reports")
        reports_dir.mkdir(parents=True, exist_ok=True)
        ts = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")

        # Generate report content
        content = generate_verification_report_content(req)

        # Export as PDF
        filename = f"gdpr-verification-{ts}.pdf"
        filepath = export_report(content, str(reports_dir))
        filename = Path(filepath).name

        return ReportResponse(
            filename=filename, path=filepath, download_url=f"/api/v1/reports/download/{filename}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to generate verification report: {str(e)}"
        ) from e


def create_policy_revision(req: PolicyRevisionRequest) -> ReportResponse:
    """Create a revised policy document that addresses compliance issues."""
    try:
        # Generate the revised policy
        revised_policy = generate_revised_policy(req)

        # Save the revised policy
        reports_dir = Path("reports")
        reports_dir.mkdir(parents=True, exist_ok=True)
        ts = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")

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
# Generated: {datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")}
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
