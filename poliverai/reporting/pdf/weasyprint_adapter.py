"""Render (a subset of) Markdown into a nicely formatted PDF using ReportLab.

This keeps the dependency footprint small (ReportLab is already a requirement)
and implements a minimal markdown -> flowables conversion for headings, bold,
italic, paragraphs and unordered lists. It's not a full markdown renderer but
is sufficient to render the revised policy text into a readable PDF.
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem
from reportlab.lib.units import mm
from reportlab.lib import colors
import re
from typing import Optional
from io import BytesIO
import logging

# URL of the logo to embed at the end of each report
LOGO_URL = "https://poliverai.com/poliverai-logo.svg"


def _md_inline_to_html(s: str) -> str:
    """Convert basic inline markdown (**bold**, *italic*) to simple HTML tags
    supported by ReportLab's Paragraph subset.
    """
    # Bold **text**
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    # Italic *text* (avoid touching already-bold tags)
    s = re.sub(r"\*(.+?)\*", r"<i>\1</i>", s)
    # Inline code `code` -> monospace (use <font> fallback)
    s = re.sub(r"`(.+?)`", r"<font face='Courier'>\1</font>", s)
    return s


def simple_pdf_from_text(markdown_text: str, output_path: str) -> None:
    """Render a markdown string into a PDF file at output_path.

    This function handles a small subset of markdown: headings (#, ##, ###),
    unordered lists (- / *), paragraphs and simple inline formatting (bold,
    italic, inline code). The output uses ReportLab's platypus to create a
    readable PDF.
    """
    styles = getSampleStyleSheet()
    # Create a few convenient styles
    h1 = ParagraphStyle('H1', parent=styles['Heading1'], fontSize=18, leading=22, spaceAfter=8)
    h2 = ParagraphStyle('H2', parent=styles['Heading2'], fontSize=14, leading=18, spaceAfter=6)
    h3 = ParagraphStyle('H3', parent=styles['Heading3'], fontSize=12, leading=16, spaceAfter=6)
    normal = ParagraphStyle('Normal', parent=styles['BodyText'], fontSize=10, leading=14)
    small = ParagraphStyle('Small', parent=styles['BodyText'], fontSize=9, leading=12, textColor=colors.gray)

    doc = SimpleDocTemplate(output_path, pagesize=A4, leftMargin=20*mm, rightMargin=20*mm, topMargin=20*mm, bottomMargin=20*mm)
    story = []

    lines = markdown_text.replace('\r\n', '\n').split('\n')
    i = 0
    while i < len(lines):
        line = lines[i].rstrip()
        if not line.strip():
            story.append(Spacer(1, 6))
            i += 1
            continue

        if line.startswith('# '):
            text = _md_inline_to_html(line[2:].strip())
            story.append(Paragraph(text, h1))
            i += 1
            continue

        if line.startswith('## '):
            text = _md_inline_to_html(line[3:].strip())
            story.append(Paragraph(text, h2))
            i += 1
            continue

        if line.startswith('### '):
            text = _md_inline_to_html(line[4:].strip())
            story.append(Paragraph(text, h3))
            i += 1
            continue

        # Unordered list
        if line.lstrip().startswith(('- ', '* ')):
            items = []
            while i < len(lines) and lines[i].lstrip().startswith(('- ', '* ')):
                raw = lines[i].lstrip()[2:].strip()
                html = _md_inline_to_html(raw)
                items.append(ListItem(Paragraph(html, normal)))
                i += 1
            lf = ListFlowable(items, bulletType='bullet', leftIndent=12)
            story.append(lf)
            story.append(Spacer(1, 6))
            continue

        # Horizontal rule
        if line.strip().startswith('---'):
            story.append(Spacer(1, 6))
            i += 1
            continue

        # Otherwise a paragraph (may span multiple lines until blank)
        para_lines = [line]
        i += 1
        while i < len(lines) and lines[i].strip() != '':
            para_lines.append(lines[i])
            i += 1
        para_text = ' '.join(l.strip() for l in para_lines)
        para_text = _md_inline_to_html(para_text)
        story.append(Paragraph(para_text, normal))
        story.append(Spacer(1, 4))

    # Fallback if no content
    if not story:
        story.append(Paragraph('', normal))

    # Attempt to append a centered logo image (convert SVG -> PNG if possible)
    try:
        png_bytes: Optional[bytes] = None
        try:
            import requests
            resp = requests.get(LOGO_URL, timeout=3)
            if resp.status_code == 200:
                svg_bytes = resp.content
                try:
                    import cairosvg
                    png_bytes = cairosvg.svg2png(bytestring=svg_bytes)
                except Exception:
                    # cairosvg not available or conversion failed
                    png_bytes = None
        except Exception:
            png_bytes = None

        if png_bytes:
            from reportlab.platypus import Image as RLImage
            img_buf = BytesIO(png_bytes)
            # target height ~ 40px -> convert to points (approx 30pt)
            img = RLImage(img_buf, height=30)
            img.hAlign = 'CENTER'
            story.append(Spacer(1, 8))
            story.append(img)
        else:
            # fallback: centered clickable text with link
            link_html = f'<p align="center"><a href="{LOGO_URL}">{LOGO_URL}</a></p>'
            story.append(Spacer(1, 8))
            story.append(Paragraph(link_html, small))
    except Exception:
        logging.exception('Failed to append logo to PDF')

    doc.build(story)


def simple_pdf_from_image(image_bytes: bytes, output_path: str) -> None:
    """Create a single-page PDF that places the provided image_bytes to fill
    a standard A4 page while preserving aspect ratio.
    """
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas
    from reportlab.lib.utils import ImageReader
    from io import BytesIO

    buf = BytesIO(image_bytes)
    img = ImageReader(buf)

    c = canvas.Canvas(output_path, pagesize=A4)
    page_w, page_h = A4
    iw, ih = img.getSize()

    # Calculate scale to fit the page while preserving aspect ratio
    scale = min(page_w / iw, page_h / ih)
    draw_w = iw * scale
    draw_h = ih * scale

    # Center the image on the page
    x = (page_w - draw_w) / 2
    y = (page_h - draw_h) / 2

    c.drawImage(img, x, y, width=draw_w, height=draw_h, preserveAspectRatio=True, mask='auto')
    c.showPage()
    # Append centered logo on its own page bottom area (try convert SVG->PNG first)
    try:
        png_bytes = None
        try:
            import requests
            resp = requests.get(LOGO_URL, timeout=3)
            if resp.status_code == 200:
                svg_bytes = resp.content
                try:
                    import cairosvg
                    png_bytes = cairosvg.svg2png(bytestring=svg_bytes)
                except Exception:
                    png_bytes = None
        except Exception:
            png_bytes = None

        if png_bytes:
            from reportlab.lib.utils import ImageReader
            img_buf = BytesIO(png_bytes)
            logo = ImageReader(img_buf)
            lw, lh = logo.getSize()
            # scale to small height (30pt)
            target_h = 30
            scale = target_h / lh
            lw_scaled = lw * scale
            x_logo = (page_w - lw_scaled) / 2
            y_logo = 10  # small margin from bottom
            c.drawImage(logo, x_logo, y_logo, width=lw_scaled, height=target_h, preserveAspectRatio=True, mask='auto')
        else:
            # fallback: draw text link centered near bottom
            c.setFont('Helvetica', 9)
            text = LOGO_URL
            text_w = c.stringWidth(text, 'Helvetica', 9)
            c.drawString((page_w - text_w) / 2, 12, text)
    except Exception:
        logging.exception('Failed to append logo on image PDF')

    c.save()
