from bs4 import BeautifulSoup

from ...core.exceptions import IngestionError


def read_html_text(path: str) -> str:
    try:
        with open(path, encoding="utf-8", errors="ignore") as f:
            html = f.read()
        soup = BeautifulSoup(html, "html.parser")
        return soup.get_text(" ", strip=True)
    except Exception as e:
        raise IngestionError(f"Failed to read HTML file '{path}': {e}") from e
