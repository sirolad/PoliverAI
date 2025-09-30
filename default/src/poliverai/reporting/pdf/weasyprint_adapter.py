# For portability in early dev, use ReportLab to generate a very simple PDF.
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

# Constants
MARGIN_SIZE = 40


def simple_pdf_from_text(text: str, output_path: str) -> None:
    c = canvas.Canvas(output_path, pagesize=A4)
    width, height = A4
    x, y = MARGIN_SIZE, height - MARGIN_SIZE
    for line in text.splitlines() or [""]:
        if y < MARGIN_SIZE:
            c.showPage()
            y = height - MARGIN_SIZE
        c.drawString(x, y, line[:120])
        y -= 16
    c.save()
