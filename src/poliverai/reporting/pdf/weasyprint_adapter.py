# For portability in early dev, use ReportLab to generate a very simple PDF.
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas


def simple_pdf_from_text(text: str, output_path: str) -> None:
    c = canvas.Canvas(output_path, pagesize=A4)
    width, height = A4
    x, y = 40, height - 40
    for line in text.splitlines() or [""]:
        if y < 40:
            c.showPage()
            y = height - 40
        c.drawString(x, y, line[:120])
        y -= 16
    c.save()