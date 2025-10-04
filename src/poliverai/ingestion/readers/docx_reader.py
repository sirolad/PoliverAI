from docx import Document

from ...core.exceptions import IngestionError


def read_docx_text(path: str) -> str:
    try:
        doc = Document(path)
        return "\n".join(p.text for p in doc.paragraphs)
    except Exception as e:
        raise IngestionError(f"Failed to read DOCX file '{path}': {e}") from e
