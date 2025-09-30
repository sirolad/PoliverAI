import pdfplumber


def read_pdf_text(path: str) -> str:
    text_parts: list[str] = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            txt: str | None = page.extract_text()  # type: ignore[assignment]
            if txt:
                text_parts.append(txt)
    return "\n".join(text_parts)
