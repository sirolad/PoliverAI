"""Main reports API routes using modular handlers and utilities.

This module provides the FastAPI routes for report generation,
using the modular handler and utility functions.
"""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from ....models.api import (
    PolicyRevisionRequest,
    ReportRequest,
    ReportResponse,
    VerificationReportRequest,
)
from .report_handlers import (
    create_policy_revision,
    create_simple_report,
    create_verification_report,
)

router = APIRouter(tags=["reports"])


@router.post("/reports", response_model=ReportResponse)
async def generate_report(req: ReportRequest) -> ReportResponse:
    """Generate a simple report from content."""
    return create_simple_report(req)


@router.post("/verification-report", response_model=ReportResponse)
async def generate_verification_report(req: VerificationReportRequest) -> ReportResponse:
    """Generate a comprehensive verification report."""
    return create_verification_report(req)


@router.post("/generate-revision", response_model=ReportResponse)
async def generate_policy_revision(req: PolicyRevisionRequest) -> ReportResponse:
    """Generate a revised policy document that addresses compliance issues."""
    return create_policy_revision(req)


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


# Legacy endpoints for backward compatibility
@router.post("/export")
async def export_report_legacy(req: VerificationReportRequest) -> ReportResponse:
    """Legacy export endpoint for backward compatibility."""
    return create_verification_report(req)


@router.post("/revision")
async def generate_revision_legacy(req: PolicyRevisionRequest) -> ReportResponse:
    """Legacy revision endpoint for backward compatibility."""
    return create_policy_revision(req)
