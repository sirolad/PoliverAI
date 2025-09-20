import re
from collections.abc import Iterable

from ..domain.models import Clause

# Constants for segmentation
MAX_HEADER_LENGTH = 80
MAX_CAPS_HEADER_LENGTH = 50
MIN_MEANINGFUL_WORDS = 5
MAX_SINGLE_PARAGRAPH_LENGTH = 500


def split_into_paragraphs(text: str) -> list[Clause]:
    # First try standard double newline separation
    if "\n\n" in text:
        paragraphs: Iterable[str] = (p.strip() for p in text.split("\n\n"))
        clauses = [Clause(text=p) for p in paragraphs if p]
        if len(clauses) > 1:
            return clauses

    # For PDFs and other formats with single newlines, use smarter segmentation
    lines = text.split("\n")
    paragraphs = []
    current_paragraph = []

    for original_line in lines:
        line = original_line.strip()
        if not line:
            # Empty line - end current paragraph if it has content
            if current_paragraph:
                paragraphs.append(" ".join(current_paragraph))
                current_paragraph = []
        elif (
            # New paragraph indicators
            line.endswith("?")
            or line.endswith(".")
            or line.endswith("!")
            or
            # Headers or section titles (short lines)
            (len(line) < MAX_HEADER_LENGTH and not current_paragraph)
            or
            # Lines that look like headers (all caps, short)
            (line.isupper() and len(line) < MAX_CAPS_HEADER_LENGTH)
        ):
            current_paragraph.append(line)
            # End paragraph on sentence endings or headers
            if line.endswith((".", "?", "!")) or (
                line.isupper() and len(line) < MAX_CAPS_HEADER_LENGTH
            ):
                paragraphs.append(" ".join(current_paragraph))
                current_paragraph = []
        else:
            current_paragraph.append(line)

    # Add any remaining content
    if current_paragraph:
        paragraphs.append(" ".join(current_paragraph))

    # Filter out very short paragraphs (less than 5 words) and create clauses
    meaningful_paragraphs = [p for p in paragraphs if len(p.split()) >= MIN_MEANINGFUL_WORDS]

    # If we still have just one large paragraph, try to split by sentence patterns
    if (
        len(meaningful_paragraphs) == 1
        and len(meaningful_paragraphs[0]) > MAX_SINGLE_PARAGRAPH_LENGTH
    ):
        # Split by common section patterns in policies
        text_to_split = meaningful_paragraphs[0]
        sentence_splits = re.split(r"(?<=\.) (?=[A-Z][a-zA-Z ]{10,})", text_to_split)
        if len(sentence_splits) > 1:
            meaningful_paragraphs = [
                s.strip() for s in sentence_splits if len(s.split()) >= MIN_MEANINGFUL_WORDS
            ]

    return [Clause(text=p) for p in meaningful_paragraphs if p]
