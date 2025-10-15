"""Render (a subset of) Markdown into a nicely formatted PDF using ReportLab.

This keeps the dependency footprint small (ReportLab is already a requirement)
and implements a minimal markdown -> flowables conversion for headings, bold,
italic, paragraphs and unordered lists. It's not a full markdown renderer but
is sufficient to render the revised policy text into a readable PDF.

Enhancements:
- Markdown image lines are supported:
    ![Alt](https://example.com/logo.svg "Title"){height=80 align=center}
  height is in pixels (converted to pt ~ px*0.75). align supports left|center|right.
- SVG rendering via svglib (preferred). Fallback to cairosvg -> PNG if available.
- Reliable centering for both RL Image and Drawing using a single-cell Table wrapper.
- Prevent oversize flowables via KeepInFrame.
"""
import importlib
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem,
    Image as RLImage, Table, TableStyle, KeepInFrame
)
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.utils import ImageReader
import re, logging, base64
from typing import List, Optional, Tuple
from io import BytesIO
from pathlib import Path

MODULE_DIR = Path(__file__).resolve().parent
LOGO_PATH = str(MODULE_DIR / "poliverai-logo.png")

# URL of the logo to embed at the end of each report
LOGO_URL = "https://poliverai.com/poliverai-logo.png"

# ---- Configuration -----------------------------------------------------------
PX_TO_PT = 0.75  # 1 px ≈ 0.75 pt (72/96)
PADDING_PX = 5
PADDING_PT = PADDING_PX * PX_TO_PT  # 3.75pt ≈ 5px
IMAGE_AFTER_SPACER_PT = PADDING_PT  # spacer after an image line

# Markdown image detection: ![alt](url "title"){height=80 align=center}
IMG_RE = re.compile(
    r'!\[(?P<alt>[^\]]*)\]\('
    r'(?P<src>\S+?)'                              # URL (no spaces)
    r'(?:\s+"(?P<title>[^"]*)")?'                # optional "title"
    r'\)'
    r'(?:\{(?P<attrs>[^}]*)\})?'                 # optional {height=80 align=center}
    r'\s*$'
)

# ---- Utilities ---------------------------------------------------------------

def _load_local_bytes(src: str) -> Optional[bytes]:
    try:
        p = Path(src)
        if not p.is_file():
            p = MODULE_DIR / src  # also try next to this script
        return p.read_bytes()
    except Exception as e:
        logging.info("Local read failed for %s: %s", src, e)
        return None

def _image_flowable(src: str, height_px: Optional[float], align: Optional[str]):
    # data: URI?
    data = _bytes_from_data_uri(src)
    if data is None:
        if src.startswith('http'):
            data = _fetch_bytes(src)
        else:
            data = _load_local_bytes(src)   # <-- use local file
    if not data:
        return None


def _parse_img_attrs(attrs: Optional[str]) -> Tuple[Optional[float], Optional[str]]:
    """Parse attr string like 'height=80 align=center' -> (height_px, align)."""
    if not attrs:
        return None, None
    height_px: Optional[float] = None
    align: Optional[str] = None
    for part in attrs.split():
        if '=' in part:
            k, v = part.split('=', 1)
            k = k.strip().lower()
            v = v.strip().strip('"').strip("'")
            if k == 'height':
                v_num = v.replace('px', '')
                try:
                    height_px = float(v_num)
                except ValueError:
                    pass
            elif k in ('align', 'align-items', 'text-align'):
                v = v.lower()
                if v in ('left', 'center', 'right'):
                    align = v
    return height_px, align

def _fetch_bytes(url: str) -> Optional[bytes]:
    """Fetch bytes from URL with a friendly UA and short timeout."""
    try:
        import requests
        headers = {"User-Agent": "PoliverAI-PDF/1.0 (+reportlab)"}
        resp = requests.get(url, timeout=8, headers=headers)
        resp.raise_for_status()
        return resp.content
    except Exception as e:
        logging.warning("Failed to fetch %s: %s", url, e)
        return None

def _bytes_from_data_uri(src: str) -> Optional[bytes]:
    if not src.startswith('data:'):
        return None
    try:
        header, b64 = src.split(',', 1)
        if ';base64' in header:
            return base64.b64decode(b64)
        return b64.encode('utf-8')
    except Exception as e:
        logging.info("Bad data URI: %s", e)
        return None

def _is_svg(data: bytes, url: str) -> bool:
    if url.lower().endswith(".svg"):
        return True
    head = data[:512].lower()
    return b"<svg" in head

def _svg_to_drawing(svg_bytes: bytes, target_height_pt: Optional[float]):
    """Convert SVG bytes into a Drawing (svglib). Return Drawing or None.
       Always update drawing.width/height after scaling to avoid oversize errors.
    """
    try:
        from svglib.svglib import svg2rlg
        drawing = svg2rlg(BytesIO(svg_bytes))
        if drawing is None:
            return None
        if target_height_pt and getattr(drawing, "height", None):
            orig_w = float(getattr(drawing, "width", 0) or 0)
            orig_h = float(getattr(drawing, "height", 0) or 0)
            if orig_h > 0:
                s = target_height_pt / orig_h
                # Scale graphic content
                drawing.scale(s, s)
                # IMPORTANT: also update reported width/height so Platypus knows the new size
                if orig_w > 0:
                    drawing.width = orig_w * s
                drawing.height = orig_h * s
        return drawing
    except Exception as e:
        logging.info("svglib failed to load SVG: %s", e)
        return None

def _svg_to_png(svg_bytes: bytes) -> Optional[bytes]:
    """Fallback: rasterize SVG to PNG using cairosvg if available."""
    try:
        import cairosvg
        return cairosvg.svg2png(bytestring=svg_bytes)
    except Exception as e:
        logging.info("cairosvg failed to convert SVG to PNG: %s", e)
        return None

def _raster_image_flowable(img_bytes: bytes, target_height_pt: Optional[float]):
    """Build RL Image flowable from raster bytes, scaling to target height if given."""
    try:
        ir = ImageReader(BytesIO(img_bytes))
        iw, ih = ir.getSize()  # in points at 72dpi
        if target_height_pt and ih:
            scale = target_height_pt / ih
            fw = iw * scale
            fh = ih * scale
            return RLImage(BytesIO(img_bytes), width=fw, height=fh)
        return RLImage(BytesIO(img_bytes))
    except Exception as e:
        logging.info("Failed to build raster RLImage: %s", e)
        return None

def _make_centered(flowable, align: Optional[str], pad_pt: float = PADDING_PT):
    """Center + add padding (~5px) around the flowable (works for Drawing or Image)."""
    # Always wrap in a 1-cell table so we can apply padding consistently
    tbl = Table([[flowable]])
    tbl.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), (align or "CENTER").upper()),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), pad_pt),
        ("RIGHTPADDING", (0, 0), (-1, -1), pad_pt),
        ("TOPPADDING", (0, 0), (-1, -1), pad_pt),
        ("BOTTOMPADDING", (0, 0), (-1, -1), pad_pt),
    ]))
    return tbl

def _image_flowable_from_url(url: str, height_px: Optional[float], align: Optional[str]):
    """Fetch URL and return an aligned flowable (Drawing or RLImage)."""
    data = _fetch_bytes(url)
    if not data:
        return None
    target_height_pt = height_px * PX_TO_PT if height_px else None

    if _is_svg(data, url):
        # First-choice: svglib (vector in PDF)
        drawing = _svg_to_drawing(data, target_height_pt)
        if drawing:
            return _make_centered(drawing, align)
        # Fallback: cairosvg -> PNG -> RLImage
        png = _svg_to_png(data)
        if png:
            img = _raster_image_flowable(png, target_height_pt)
            if img:
                return _make_centered(img, align)
        return None

    # Non-SVG: treat as raster
    img = _raster_image_flowable(data, target_height_pt)
    if img:
        return _make_centered(img, align)
    return None

def _image_flowable(src: str, height_px: Optional[float], align: Optional[str]):
    """Support data: URIs, http(s) URLs and local file paths."""
    data = _bytes_from_data_uri(src)
    if data is None:
        if src.startswith('http'):
            data = _fetch_bytes(src)
        else:
            try:
                with open(src, 'rb') as f:
                    data = f.read()
            except Exception as e:
                logging.info("Open failed for %s: %s", src, e)
                data = None
    if not data:
        return None

    target_height_pt = height_px * PX_TO_PT if height_px else None
    if _is_svg(data, src):
        drawing = _svg_to_drawing(data, target_height_pt)
        if drawing:
            return _make_centered(drawing, align)
        png = _svg_to_png(data)
        if png:
            rf = _raster_image_flowable(png, target_height_pt)
            if rf:
                return _make_centered(rf, align)
        return None

    rf = _raster_image_flowable(data, target_height_pt)
    return _make_centered(rf, align) if rf else None

# ---- Inline formatting -------------------------------------------------------

def _md_inline_to_html(s: str) -> str:
    """Convert basic inline markdown (**bold**, *italic*, `code`) to simple HTML tags
    supported by ReportLab's Paragraph subset.
    """
    # Bold **text**
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    # Italic *text* (simple pass; works for common cases)
    s = re.sub(r"\*(.+?)\*", r"<i>\1</i>", s)
    # Inline code `code` -> monospace
    s = re.sub(r"`(.+?)`", r"<font face='Courier'>\1</font>", s)
    return s

# ---- Main renderers ----------------------------------------------------------

def simple_pdf_from_text(markdown_text: str, output_path: str) -> None:
    """Render a markdown string into a PDF file at output_path.

    Supports:
      - Headings (#, ##, ###)
      - Unordered lists (- or * at the start)
      - Paragraphs with **bold**, *italic*, and `code`
      - Standalone image lines:
          ![Alt](URL "Title"){height=80 align=center}
    """
    styles = getSampleStyleSheet()
    h1 = ParagraphStyle('H1', parent=styles['Heading1'], fontSize=18, leading=22, spaceAfter=8)
    h2 = ParagraphStyle('H2', parent=styles['Heading2'], fontSize=14, leading=18, spaceAfter=6)
    h3 = ParagraphStyle('H3', parent=styles['Heading3'], fontSize=12, leading=16, spaceAfter=6)
    normal = ParagraphStyle('Normal', parent=styles['BodyText'], fontSize=10, leading=14)
    small = ParagraphStyle('Small', parent=styles['BodyText'], fontSize=9, leading=12, textColor=colors.gray)

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=20*mm, rightMargin=20*mm,
        topMargin=20*mm, bottomMargin=20*mm
    )
    story = []

    # Compute usable frame size for KeepInFrame
    frame_w = A4[0] - doc.leftMargin - doc.rightMargin
    frame_h = A4[1] - doc.topMargin - doc.bottomMargin

    lines = markdown_text.replace('\r\n', '\n').split('\n')
    i = 0
    while i < len(lines):
        line = lines[i].rstrip()

        # blank line -> vertical space
        if not line.strip():
            story.append(Spacer(1, IMAGE_AFTER_SPACER_PT))
            i += 1
            continue

        # Headings
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

        # Image (standalone line)
        img_m = IMG_RE.fullmatch(line.strip())
        if img_m:
            src = img_m.group('src')
            height_px, align = _parse_img_attrs(img_m.group('attrs'))
            # flow = _image_flowable(src, height_px, align)
            flow = _image_flowable(LOGO_PATH, height_px=40, align='center')

            if flow:
                # Wrap in KeepInFrame to guarantee it fits in the frame
                kif = KeepInFrame(frame_w, frame_h, [flow], mode='shrink', mergeSpace=1)
                story.append(kif)
                story.append(Spacer(1, IMAGE_AFTER_SPACER_PT))
            else:
                # graceful fallback to centered link
                alt = img_m.group('alt') or src
                story.append(Paragraph(f'<para align="center"><a href="{src}">{alt}</a></para>', small))
                story.append(Spacer(1, IMAGE_AFTER_SPACER_PT))
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
            story.append(Spacer(1, IMAGE_AFTER_SPACER_PT))
            continue

        # Horizontal rule (simple)
        if line.strip().startswith('---'):
            story.append(Spacer(1, IMAGE_AFTER_SPACER_PT))
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

    # Append centered logo at the end (vector if possible) — also KeepInFrame
    try:
        story.append(Spacer(1, 8))
        flow = _image_flowable(LOGO_URL, height_px=40, align='center')
        if flow:
            kif = KeepInFrame(frame_w, frame_h, [flow], mode='shrink', mergeSpace=1)
            story.append(kif)
        else:
            story.append(Paragraph(f'<para align="center"><a href="{LOGO_URL}">{LOGO_URL}</a></para>', small))
    except Exception:
        logging.exception('Failed to append logo to PDF')

    doc.build(story)

def simple_pdf_from_image(image_bytes: bytes, output_path: str) -> None:
    """Create a single-page PDF that places the provided image_bytes to fill
    a standard A4 page while preserving aspect ratio, then add the logo at bottom.
    """
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas

    c = canvas.Canvas(output_path, pagesize=A4)
    page_w, page_h = A4

    # Draw main image (centered, preserve aspect)
    try:
        img = ImageReader(BytesIO(image_bytes))
        iw, ih = img.getSize()
        scale = min(page_w / iw, page_h / ih)
        draw_w = iw * scale
        draw_h = ih * scale
        x = (page_w - draw_w) / 2
        y = (page_h - draw_h) / 2
        c.drawImage(img, x, y, width=draw_w, height=draw_h, preserveAspectRatio=True, mask='auto')
    except Exception as e:
        logging.exception("Failed to draw main image: %s", e)

    c.showPage()

    # Footer logo on separate page bottom area (reuse the loader path via raster fallback)
    try:
        svg = _fetch_bytes(LOGO_URL)
        logo_png = None
        if svg and _is_svg(svg, LOGO_URL):
            logo_png = _svg_to_png(svg)
        elif svg:
            logo_png = svg  # maybe PNG/JPG already

        if logo_png:
            logo = ImageReader(BytesIO(logo_png))
            lw, lh = logo.getSize()
            target_h = 30  # pt
            scale = target_h / lh if lh else 1.0
            lw_s = lw * scale
            x_logo = (page_w - lw_s) / 2
            y_logo = 10
            c.drawImage(logo, x_logo, y_logo, width=lw_s, height=target_h, preserveAspectRatio=True, mask='auto')
        else:
            c.setFont('Helvetica', 9)
            text = LOGO_URL
            text_w = c.stringWidth(text, 'Helvetica', 9)
            c.drawString((page_w - text_w) / 2, 12, text)
    except Exception:
        logging.exception('Failed to append logo on image PDF')

    c.save()

# --- helpers ---------------------------------------------------------------

def _parse_base_href(html: str) -> Optional[str]:
    m = re.search(r'<base[^>]+href=["\']([^"\']+)["\']', html, re.I)
    return m.group(1).strip() if m else None


def _split_html_css(html: str) -> Tuple[str, List[str]]:
    """
    Returns (html_without_style_blocks, list_of_css_blocks_as_strings)
    """
    css_blocks: List[str] = []

    def _style_repl(m: re.Match) -> str:
        css_blocks.append(m.group(1))
        return ""  # remove style block from HTML

    html_wo_style = re.sub(r"<style[^>]*>(.*?)</style>",
                          _style_repl,
                          html,
                          flags=re.I | re.S)
    return html_wo_style, css_blocks


def _inject_css_into_head(html: str, css_text: str) -> str:
    if not css_text.strip():
        return html
    if re.search(r"</head>", html, re.I):
        return re.sub(r"</head>", f"<style>{css_text}</style></head>", html, count=1, flags=re.I)
    # no head — create a minimal one
    return re.sub(r"(<html[^>]*>)", r"\1<head><style>" + css_text + "</style></head>", html, count=1, flags=re.I) \
        if re.search(r"<html", html, re.I) else f"<head><style>{css_text}</style></head>{html}"


def _sanitize_css_for_xhtml2pdf(css: str) -> str:
    """
    xhtml2pdf’s CSS parser is very old. We strip/normalize modern bits so it won’t explode.
    Keep this conservative; WeasyPrint gets the original CSS.
    """
    # Drop nested @-rules that trip the parser
    css = re.sub(r"@(supports|media|layer|keyframes|font-face)\b[^{]*\{(?:[^{}]|\{[^{}]*\})*\}", "", css, flags=re.I)
    # Down-level :where() / :is()
    css = re.sub(r":where\(\s*([^)]+?)\s*\)", r"\1", css, flags=re.I)
    css = re.sub(r":is\(\s*([^)]+?)\s*\)", r"\1", css, flags=re.I)
    # Remove :has() and :not() (avoid orphan combinators)
    css = re.sub(r":has\(\s*[^)]+?\s*\)", "*", css, flags=re.I)
    css = re.sub(r":not\(\s*[^)]+?\s*\)", "", css, flags=re.I)
    # Simplify var(--x, fallback)
    def _var_repl(m: re.Match) -> str:
        inner = m.group(1)
        fb = re.search(r"var\(\s*--[a-z0-9_-]+\s*,\s*([^)]+)\)", inner, flags=re.I)
        return fb.group(1) if fb else ""
    css = re.sub(r"[a-zA-Z-]+\s*:\s*([^;]*var\([^)]*\)[^;]*);", lambda m: (_var_repl(m) and re.sub(r"var\(\s*--[a-z0-9_-]+\s*,\s*([^)]+)\)", _var_repl, m.group(0), flags=re.I)) or "", css, flags=re.I)
    # Fix orphan combinators (e.g., "~ {")
    css = re.sub(r"(^|[{,])\s*[>+~]\s*(?=[^\{]*\{)", r"\1*", css)
    css = re.sub(r"([>+~])\s*(\{)", r" * \2", css)
    return css


def _strip_all_css(html: str) -> str:
    html = re.sub(r"<style[^>]*>.*?</style>", "", html, flags=re.I | re.S)
    html = re.sub(r"<link[^>]+rel=['\"]?stylesheet['\"]?[^>]*>", "", html, flags=re.I)
    html = re.sub(r"\sstyle=['\"][^'\"]*['\"]", "", html, flags=re.I)
    html = re.sub(r"\sclass=['\"][^'\"]*['\"]", "", html, flags=re.I)
    # xhtml2pdf warnings: strip inputs
    html = re.sub(r"<input\b[^>]*>", "", html, flags=re.I)
    return html


# If you already have a link_callback, import/use it here
def _link_callback(uri, rel):  # minimal passthrough; replace with your existing callback if available
    return uri


# --- main -----------------------------------------------------------------

def simple_pdf_from_html(html: str, output_path: str) -> None:
    """
    Render an HTML string into a PDF at `output_path`.

    Order: WeasyPrint (HTML + split CSS) → xhtml2pdf (sanitized CSS) → xhtml2pdf (no CSS) → plaintext.

    Asset resolution rules:
      - Prefer local files by default (images/fonts next to the app).
      - If HTML contains a remote <base href="http..."> we drop it (so local files work).
      - Rewrites root-relative URLs (/img.png) to ./img.png when using file:// base.
      - You can override the base via env:
          HTML_TO_PDF_BASE_URL   = explicit base (file://... or http://...)
          HTML_TO_PDF_ASSET_ROOT = local folder used when constructing file:// base
    """
    logging.info("HTML->PDF start: target=%s", output_path)
    if isinstance(html, bytes):
        html = html.decode("utf-8", errors="ignore")

    # 0) Decide base folder for local assets
    asset_root = Path(os.getenv("HTML_TO_PDF_ASSET_ROOT") or os.getcwd())
    file_base_url = asset_root.resolve().as_uri()  # e.g. file:///app

    # 1) Read/normalize <base href> and decide which base_url to use
    parsed_base = _parse_base_href(html)  # your helper
    env_base = os.getenv("HTML_TO_PDF_BASE_URL")
    base_url = env_base or parsed_base or file_base_url

    removed_base = False
    # If the HTML has a remote base and we're not explicitly overriding with env, drop it to prefer local files.
    if parsed_base and parsed_base.startswith(("http://", "https://")) and not env_base:
        html = re.sub(r'<\s*base\b[^>]*>', '', html, flags=re.I)
        base_url = file_base_url
        removed_base = True
        logging.info("Removed remote <base href=%s>; using local base_url=%s", parsed_base, base_url)

    # 2) Split out inline <style> blocks for WeasyPrint (your helper)
    html_wo_style, css_blocks = _split_html_css(html)
    total_css_len = sum(len(c) for c in css_blocks)
    logging.debug("Split HTML/CSS: style_blocks=%d, css_bytes=%d, html_bytes=%d",
                  len(css_blocks), total_css_len, len(html_wo_style))

    # 3) If we’re using a local file base, rewrite root-relative asset URLs ("/foo.png") to "foo.png"
    #    so they resolve under file://…/ (WeasyPrint doesn’t join root-relative with file:// roots).
    root_rewrites = 0
    if base_url.startswith("file://"):
        # src="/foo.png" → src="foo.png"
        # - (?!/) avoids protocol-relative //cdn...
        # - capture only two groups: prefix (attr + opening quote) and path
        _root_rel_pat = re.compile(
            r'((?:src|href)\s*=\s*["\'])/(?!/|https?:|data:|mailto:|tel:|#)([^"\']+)', re.I
        )

        def _slash_fix(m: re.Match) -> str:
            nonlocal root_rewrites
            root_rewrites += 1
            prefix, path = m.group(1), m.group(2)  # two groups only
            return f'{prefix}{path}'               # drop the leading slash

        html_wo_style = _root_rel_pat.sub(_slash_fix, html_wo_style)
        if root_rewrites:
            logging.info("Rewrote %d root-relative URL(s) to relative for file:// base.", root_rewrites)

    logging.debug("Base URL for rendering: %s (removed_remote_base=%s, asset_root=%s)",
                  base_url, removed_base, asset_root)

    # 4) WeasyPrint (best support)
    try:
        wp = importlib.import_module("weasyprint")
        from weasyprint.text.fonts import FontConfiguration  # type: ignore
        HTML = getattr(wp, "HTML", None)
        CSS = getattr(wp, "CSS", None)
        if HTML and CSS:
            logging.info("Trying WeasyPrint with split CSS…")
            font_config = FontConfiguration()
            stylesheets = [CSS(string=css, base_url=base_url, font_config=font_config)
                           for css in css_blocks] if css_blocks else None

            # PRO TIP: inline a <base href> for WeasyPrint only when it’s a local file base.
            # (It will ignore it for network fetches anyway.)
            if base_url.startswith("file://"):
                # ensure no lingering <base> remains
                html_wo_style = re.sub(r'<\s*base\b[^>]*>', '', html_wo_style, flags=re.I)
                # (Optional) You can inject a base tag; WeasyPrint mainly uses the base_url arg though.
                # html_wo_style = _inject_base(html_wo_style, base_url)  # if you have such a helper

            HTML(string=html_wo_style, base_url=base_url).write_pdf(
                target=str(output_path),
                stylesheets=stylesheets,
                font_config=font_config,
            )
            logging.info("WeasyPrint SUCCESS -> %s", output_path)

            # Extra diagnostics (first few image URLs and whether they exist on disk)
            _log_local_asset_checks(html_wo_style, asset_root)
            return
        else:
            logging.warning("WeasyPrint module present but HTML/CSS classes not found.")
    except Exception as e:
        logging.warning("WeasyPrint unavailable/failed: %s", e)

    # 5) xhtml2pdf (sanitized CSS)
    try:
        logging.info("Trying xhtml2pdf (sanitized CSS)…")
        from xhtml2pdf import pisa  # type: ignore

        combined_css = "\n\n".join(css_blocks) if css_blocks else ""
        sanitized_css = _sanitize_css_for_xhtml2pdf(combined_css)
        if combined_css and not sanitized_css:
            logging.debug("All CSS stripped during sanitization (combined was %d bytes).", len(combined_css))
        logging.debug("Sanitized CSS length: %d", len(sanitized_css))

        sanitized_html = _inject_css_into_head(html_wo_style, sanitized_css)

        # (Optional) Help xhtml2pdf with a file base by injecting a <base> tag too
        if base_url.startswith("file://"):
            sanitized_html = re.sub(r'<\s*base\b[^>]*>', '', sanitized_html, flags=re.I)
            sanitized_html = _inject_css_into_head(
                sanitized_html,
                f'/* injected base for xhtml2pdf */'
            )
            sanitized_html = sanitized_html.replace(
                "<head>",
                f'<head><base href="{base_url}/">'
            )

        with open(output_path, "wb") as out_f:
            result = pisa.CreatePDF(sanitized_html, dest=out_f, link_callback=_link_callback)
        if getattr(result, "err", 0):
            raise RuntimeError(f"xhtml2pdf reported {result.err} error(s)")
        logging.info("xhtml2pdf SUCCESS (sanitized) -> %s", output_path)
        return
    except Exception as e:
        logging.error("xhtml2pdf FAILED even after CSS sanitization: %s", e)

    # 6) xhtml2pdf (no CSS)
    try:
        logging.info("Retrying xhtml2pdf with ALL CSS removed…")
        from xhtml2pdf import pisa  # type: ignore
        html_no_css = _strip_all_css(html)
        with open(output_path, "wb") as out_f:
            result2 = pisa.CreatePDF(html_no_css, dest=out_f, link_callback=_link_callback)
        if getattr(result2, "err", 0):
            raise RuntimeError(f"xhtml2pdf (no CSS) reported {result2.err} error(s)")
        logging.info("xhtml2pdf SUCCESS (no CSS) -> %s", output_path)
        return
    except Exception as e:
        logging.warning("xhtml2pdf (no CSS) FAILED: %s", e)

    # 7) Plain-text fallback
    logging.warning("FALLBACK: rendering as plaintext (both HTML engines failed)")
    try:
        text = re.sub(r'<\s*br\s*/?>', '\n', html, flags=re.I)
        text = re.sub(r'<[^>]+>', '', text)
        text = re.sub(r"\n{2,}", "\n\n", text)
        simple_pdf_from_text(text, output_path)  # your existing function
        logging.info("Plaintext PDF generated -> %s", output_path)
    except Exception:
        logging.exception("Failed to render HTML to PDF using any backend")
        raise


# --- optional tiny helper for diagnostics (safe to keep) ----------------------

def _log_local_asset_checks(html: str, root: Path, limit: int = 5) -> None:
    """Log a few src/href values and whether they exist relative to `root`."""
    urls = re.findall(r'(?:src|href)\s*=\s*["\']([^"\']+)["\']', html, flags=re.I)
    checked = 0
    for u in urls:
        if u.startswith(("http://", "https://", "data:", "mailto:", "tel:", "#")):
            continue
        p = (root / u.lstrip("/")).resolve()
        logging.debug("Asset check: %s -> %s exists=%s", u, p, p.exists())
        checked += 1
        if checked >= limit:
            break