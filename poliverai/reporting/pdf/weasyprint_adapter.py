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

    doc.build(story)
