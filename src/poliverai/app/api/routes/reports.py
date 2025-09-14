from datetime import datetime
from pathlib import Path
from fastapi import APIRouter
from pydantic import BaseModel


class ReportRequest(BaseModel):
    content: str
    format: str = "pdf"  # or "docx"


class ReportResponse(BaseModel):
    path: str


router = APIRouter(tags=["reports"])


@router.post("/reports", response_model=ReportResponse)
async def generate_report(req: ReportRequest) -> ReportResponse:
    # Placeholder: write markdown as .txt and return path; exporter will evolve later
    reports_dir = Path("reports")
    reports_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    out = reports_dir / f"compliance-report-{ts}.txt"
    out.write_text(req.content)
    return ReportResponse(path=str(out))