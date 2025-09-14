from typing import Iterable, List

from ..domain.models import Clause


def split_into_paragraphs(text: str) -> List[Clause]:
    paragraphs: Iterable[str] = (p.strip() for p in text.split("\n\n"))
    return [Clause(text=p) for p in paragraphs if p]