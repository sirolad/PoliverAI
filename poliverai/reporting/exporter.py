from datetime import datetime
from pathlib import Path

from .pdf.weasyprint_adapter import simple_pdf_from_text, simple_pdf_from_image


def export_report(markdown: str, out_dir: str = "reports") -> str:
    """Export a simple text-to-PDF report (placeholder)."""
    Path(out_dir).mkdir(parents=True, exist_ok=True)
    ts = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    out_path = Path(out_dir) / f"compliance-report-{ts}.pdf"
    simple_pdf_from_text(markdown, str(out_path))
    return str(out_path)


def export_report_image(image_bytes: bytes, out_dir: str = "reports") -> str:
    Path(out_dir).mkdir(parents=True, exist_ok=True)
    ts = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    out_path = Path(out_dir) / f"compliance-image-{ts}.pdf"
    simple_pdf_from_image(image_bytes, str(out_path))
    return str(out_path)
