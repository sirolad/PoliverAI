"""
GDPR Article Title Lookup Utility

Provides functions to get full article titles for display in sources and verification results.
This ensures that article references like "Article 6(1)" are displayed as
"Article 6(1) Lawfulness of processing" for better user understanding.
"""

import logging
from pathlib import Path

import yaml


# Cache for article titles to avoid repeated file reads
class _ArticleTitleCache:
    def __init__(self):
        self._titles: dict[str, str] | None = None

    def get_titles(self) -> dict[str, str]:
        if self._titles is not None:
            return self._titles
        return self._load_titles()

    def _load_titles(self) -> dict[str, str]:
        try:
            articles_file = Path(__file__).parent / "gdpr" / "articles.yaml"

            if not articles_file.exists():
                logging.warning(f"GDPR articles file not found: {articles_file}")
                self._titles = {}
                return {}

            with open(articles_file, encoding="utf-8") as f:
                articles_data = yaml.safe_load(f) or []

            # Build mapping from article number to title
            titles = {}
            for article_info in articles_data:
                if isinstance(article_info, dict):
                    article_num = article_info.get("article", "").strip()
                    title = article_info.get("title", "").strip()
                    if article_num and title:
                        titles[article_num] = title

            self._titles = titles
            logging.info(f"Loaded {len(titles)} GDPR article titles")
            return titles

        except Exception as e:
            logging.error(f"Error loading GDPR article titles: {e}")
            self._titles = {}
            return {}


# Global cache instance
_cache = _ArticleTitleCache()


def _load_article_titles() -> dict[str, str]:
    """Load article titles from the GDPR articles YAML file."""
    return _cache.get_titles()


def get_article_with_title(article_number: str) -> str:
    """
    Get the full article reference with title.

    Args:
        article_number: Article reference like "Article 6(1)" or "Article 13(1)(c)"

    Returns:
        Full article reference with title like "Article 6(1) Lawfulness of processing"
        If no title is found, returns the original article number.

    Examples:
        >>> get_article_with_title("Article 6(1)")
        "Article 6(1) Lawfulness of processing"
        >>> get_article_with_title("Article 17")
        "Article 17 Right to erasure ('right to be forgotten')"
        >>> get_article_with_title("Article 99")
        "Article 99 Entry into force and application"
    """
    if not article_number:
        return ""

    titles = _load_article_titles()
    title = titles.get(article_number.strip())

    if title:
        return f"{article_number} {title}"
    else:
        # Return original if no title found
        return article_number


def get_article_title_only(article_number: str) -> str:
    """
    Get just the title part of an article.

    Args:
        article_number: Article reference like "Article 6(1)"

    Returns:
        Just the title like "Lawfulness of processing"
        Returns empty string if no title is found.
    """
    if not article_number:
        return ""

    titles = _load_article_titles()
    return titles.get(article_number.strip(), "")


def format_article_for_display(article_number: str, include_title: bool = True) -> str:
    """
    Format an article reference for display purposes.

    Args:
        article_number: Article reference like "Article 6(1)"
        include_title: Whether to include the full title

    Returns:
        Formatted article reference
    """
    if not article_number:
        return ""

    if include_title:
        return get_article_with_title(article_number)
    else:
        return article_number


# Convenience function for backward compatibility
def format_article_reference(article_number: str) -> str:
    """Format article reference with title (alias for get_article_with_title)."""
    return get_article_with_title(article_number)
