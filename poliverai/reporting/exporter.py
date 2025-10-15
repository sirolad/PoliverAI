from datetime import datetime
from pathlib import Path

from .pdf.weasyprint_adapter import simple_pdf_from_text, simple_pdf_from_html


def export_report(markdown: str, out_dir: str = "reports") -> str:
    """Export a simple text-to-PDF report (placeholder)."""
    Path(out_dir).mkdir(parents=True, exist_ok=True)
    ts = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    out_path = Path(out_dir) / f"compliance-report-{ts}.pdf"
    simple_pdf_from_text(markdown, str(out_path))
    return str(out_path)


def export_report_html(html: str, out_dir: str = "reports") -> str:
    """Render an HTML string into a PDF and return the generated path."""
    Path(out_dir).mkdir(parents=True, exist_ok=True)
    ts = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    out_path = Path(out_dir) / f"compliance-html-{ts}.pdf"
    # simple_pdf_from_html will accept an HTML string and attempt WeasyPrint/xhtml2pdf
    simple_pdf_from_html(html, str(out_path))
    return str(out_path)
