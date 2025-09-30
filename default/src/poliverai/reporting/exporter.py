from datetime import datetime
from pathlib import Path

from .pdf.weasyprint_adapter import simple_pdf_from_text


def export_report(markdown: str, out_dir: str = "reports") -> str:
    """Export a simple text-to-PDF report (placeholder)."""
    Path(out_dir).mkdir(parents=True, exist_ok=True)
    ts = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    out_path = Path(out_dir) / f"compliance-report-{ts}.pdf"
    simple_pdf_from_text(markdown, str(out_path))
    return str(out_path)
