"""RAG utilities for text processing and document handling.

This module contains utility functions for text processing, embedding,
chunking, file reading, and document ingestion.
"""

from __future__ import annotations

import hashlib
import logging
import os
import re
from pathlib import Path
from typing import Any

import tiktoken

from ..core.config import get_settings
from ..core.exceptions import IngestionError
from ..ingestion.readers.docx_reader import read_docx_text
from ..ingestion.readers.html_reader import read_html_text
from ..ingestion.readers.pdf_reader import read_pdf_text
from ..knowledge.mappings import map_requirement_to_articles

# Constants for text processing
MAX_LINE_LENGTH_FOR_TITLE = 150
MAX_TITLE_LENGTH = 100
MIN_TITLE_LENGTH = 10
MAX_LINES_TO_CHECK_FOR_TITLE = 5

# Stop words for lexical overlap
_STOP = {
    "the",
    "a",
    "an",
    "and",
    "or",
    "of",
    "to",
    "in",
    "for",
    "on",
    "with",
    "by",
    "as",
    "is",
    "are",
    "be",
    "that",
    "this",
    "it",
    "at",
    "from",
    "we",
    "you",
    "your",
    "our",
}

logger = logging.getLogger(__name__)


def encode_text(text: str) -> list[int]:
    """Encode text using tiktoken."""
    from .rag_core import _init

    enc = tiktoken.get_encoding(_init().enc_name)
    return enc.encode(text)


def decode_tokens(tokens: list[int]) -> str:
    """Decode tokens using tiktoken."""
    from .rag_core import _init

    enc = tiktoken.get_encoding(_init().enc_name)
    return enc.decode(tokens)


def get_max_embedding_tokens(model: str) -> int:
    """Get maximum tokens for embedding model."""
    m = (model or "").lower()
    # Known OpenAI embedding models
    if "text-embedding-3" in m:
        return 8192
    if "text-embedding-ada-002" in m:
        return 8191
    # Default to a safe limit if unknown
    return 8192


def chunk_by_tokens(text: str, chunk_size: int, overlap: int) -> list[str]:
    """Chunk text by token count with overlap."""
    if chunk_size <= 0:
        return [text]
    tokens = encode_text(text)
    chunks: list[str] = []
    step = max(1, chunk_size - max(0, overlap))
    for start in range(0, len(tokens), step):
        window = tokens[start : start + chunk_size]
        if not window:
            break
        chunks.append(decode_tokens(window))
    return chunks


def generate_chunk_id(source: str, chunk_text: str, i: int) -> str:
    """Generate a unique ID for a chunk."""
    # Using SHA-256 instead of SHA-1 for better security
    return hashlib.sha256(f"{source}::{i}::{chunk_text}".encode()).hexdigest()


def read_file_content(path: str, ext: str) -> str:
    """Read file content based on extension."""
    if ext in {".txt", ".md"}:
        return read_text_file(path)
    elif ext == ".pdf":
        return read_pdf_text(path)
    elif ext == ".docx":
        return read_docx_text(path)
    else:  # .html / .htm
        return read_html_text(path)


def read_text_file(path: str) -> str:
    """Read a text file with UTF-8 encoding."""
    with open(path, encoding="utf-8", errors="ignore") as f:
        return f.read()


def detect_article_label(text: str) -> str | None:
    """Detect GDPR article labels in text."""
    # Try to capture patterns like "Article 5", "Article 5(1)(e)", etc.
    m = re.search(r"Article\s+\d+(?:\([^)]*\))*", text, flags=re.IGNORECASE)
    if m:
        # Normalize casing: capitalize 'Article'
        raw = m.group(0)
        return "Article " + raw.split(None, 1)[1]
    return None


def detect_document_title(text: str) -> str | None:
    """Extract a title from the beginning of a document."""
    lines = text.strip().split("\n")
    if not lines:
        return None

    # Look at the first few lines for potential titles
    for original_line in lines[:MAX_LINES_TO_CHECK_FOR_TITLE]:
        line = original_line.strip()
        if not line:
            continue

        # Skip if it's clearly not a title (too long, contains certain patterns)
        if len(line) > MAX_LINE_LENGTH_FOR_TITLE or line.lower().startswith(
            ("article", "section", "chapter")
        ):
            continue

        # Common title patterns
        title_keywords = [
            "regulation",
            "directive",
            "gdpr",
            "privacy policy",
            "data protection",
            "terms",
            "policy",
        ]
        if any(keyword in line.lower() for keyword in title_keywords):
            return line[:MAX_TITLE_LENGTH]  # Truncate if too long

        # If it's a reasonable length and doesn't contain common body text patterns
        body_text_indicators = [
            "whereas",
            "having regard",
            "pursuant",
            "the commission",
        ]
        if MIN_TITLE_LENGTH <= len(line) <= MAX_TITLE_LENGTH and not any(
            word in line.lower() for word in body_text_indicators
        ):
            return line

    return None


def process_file_chunks(path: str, text: str) -> tuple[list[str], list[str], list[dict[str, Any]]]:
    """Process text into chunks and create metadata."""
    s = get_settings()
    chunks = chunk_by_tokens(text, s.chunk_size_tokens, s.chunk_overlap_tokens)

    # Detect document title from the full text
    doc_title = detect_document_title(text)

    ids = [generate_chunk_id(os.path.basename(path), c, i) for i, c in enumerate(chunks)]
    metadatas = []
    for i, c in enumerate(chunks):
        md: dict[str, Any] = {"source": os.path.basename(path), "chunk": i}
        if doc_title:
            md["title"] = doc_title
        art = detect_article_label(c)
        if art:
            md["article"] = art
        metadatas.append(md)

    return chunks, ids, metadatas


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for a list of texts."""
    from .rag_core import _init

    s = get_settings()
    init = _init()
    if not s.openai_api_key:
        raise IngestionError(
            "OpenAI API key not set. Please export POLIVERAI_OPENAI_API_KEY or set it in .env."
        )
    model = s.openai_embedding_model
    processed: list[str] = []
    max_tokens = get_max_embedding_tokens(model)
    limit = max(1, max_tokens - 32)  # safety margin
    for original_text in texts:
        tokens = encode_text(original_text)
        if len(tokens) > limit:
            try:
                logger.warning(
                    "Truncating embedding input from %d to %d tokens for model %s",
                    len(tokens),
                    limit,
                    model,
                )
            except Exception as e:
                logging.warning(f"Failed to truncate embedding input: {e}")
            processed_text = decode_tokens(tokens[:limit])
        else:
            processed_text = original_text
        processed.append(processed_text)
    resp = init.client.embeddings.create(model=model, input=processed)
    return [d.embedding for d in resp.data]


def query_collection(query: str, k: int) -> dict[str, Any]:
    """Query the vector collection."""
    from .rag_core import _init

    init = _init()
    qv = embed_texts([query])[0]
    # Note: older/newer Chroma versions don't accept "ids" in include; ids are returned by default.
    return init.collection.query(
        query_embeddings=[qv],
        n_results=k,
        include=["documents", "metadatas", "distances"],
    )  # type: ignore[arg-type]


def tokenize_text(text: str) -> list[str]:
    """Simple alphanumeric tokenization."""
    return [t for t in re.split(r"[^a-z0-9]+", text.lower()) if t]


def lexical_overlap_score(q: str, d: str) -> float:
    """Calculate lexical overlap score between query and document."""
    qt = [t for t in tokenize_text(q) if t not in _STOP]
    dt = [t for t in tokenize_text(d) if t not in _STOP]
    if not qt or not dt:
        return 0.0
    qs = set(qt)
    ds = set(dt)
    inter = len(qs & ds)
    union = len(qs | ds)
    if union == 0:
        return 0.0
    return inter / union


def expand_queries(question: str) -> list[str]:
    """Expand queries with article mappings."""
    arts = list(map_requirement_to_articles(question))
    queries: list[str] = [question]
    for a in arts:
        queries.append(f"{question} {a}")
        queries.append(a)
    # dedupe while preserving order
    seen = set()
    out: list[str] = []
    for q in queries:
        qn = q.strip()
        if not qn or qn in seen:
            continue
        seen.add(qn)
        out.append(qn)
    return out


def ingest_paths(paths: list[str]) -> dict[str, Any]:
    """Ingest local file paths (txt/md/pdf/docx/html). Returns stats."""
    from .rag_core import _init

    _ = _init()

    supported_ext = {".txt", ".md", ".pdf", ".docx", ".html", ".htm"}
    files_ingested = 0
    chunks_ingested = 0
    skipped: list[tuple[str, str]] = []

    for p in paths:
        ext = Path(p).suffix.lower()
        if ext not in supported_ext:
            skipped.append((p, f"unsupported extension: {ext}"))
            continue

        try:
            text = read_file_content(p, ext)

            if not text.strip():
                skipped.append((p, "empty file"))
                continue

            chunks, ids, metadatas = process_file_chunks(p, text)
            if not chunks:
                skipped.append((p, "no chunks produced"))
                continue

            embeddings = embed_texts(chunks)

            # Store with precomputed embeddings
            _init().collection.upsert(
                documents=chunks,
                metadatas=metadatas,
                ids=ids,
                embeddings=embeddings,
            )

            files_ingested += 1
            chunks_ingested += len(chunks)
        except IngestionError as e:
            skipped.append((p, str(e)))
        except Exception as e:
            skipped.append((p, f"unexpected error: {e}"))

    return {
        "files": files_ingested,
        "chunks": chunks_ingested,
        "skipped": [{"path": p, "reason": r} for p, r in skipped],
    }
