"""Main RAG service interface using modular core and utilities.

This module provides the main entry point for RAG services,
using the modular core and utility functions.
"""

from __future__ import annotations

from typing import Any

# Re-export the main functions from the modular structure
from .rag_core import RAGInit, _init, answer_question, retrieve
from .rag_utils import (
    chunk_by_tokens,
    detect_article_label,
    detect_document_title,
    embed_texts,
    encode_text,
    expand_queries,
    generate_chunk_id,
    get_max_embedding_tokens,
    ingest_paths,
    lexical_overlap_score,
    process_file_chunks,
    query_collection,
    read_file_content,
    tokenize_text,
)


# Legacy function aliases for backward compatibility
def _encode(text: str) -> list[int]:
    """Legacy function - use encode_text from rag_utils instead."""
    return encode_text(text)


def _decode(tokens: list[int]) -> str:
    """Legacy function - use decode_tokens from rag_utils instead."""
    from .rag_utils import decode_tokens

    return decode_tokens(tokens)


def _max_embedding_tokens(model: str) -> int:
    """Legacy function - use get_max_embedding_tokens from rag_utils instead."""
    return get_max_embedding_tokens(model)


def _hash_id(source: str, chunk_text: str, i: int) -> str:
    """Legacy function - use generate_chunk_id from rag_utils instead."""
    return generate_chunk_id(source, chunk_text, i)


def _read_file_content(path: str, ext: str) -> str:
    """Legacy function - use read_file_content from rag_utils instead."""
    return read_file_content(path, ext)


def _process_file_chunks(path: str, text: str) -> tuple[list[str], list[str], list[dict[str, Any]]]:
    """Legacy function - use process_file_chunks from rag_utils instead."""
    return process_file_chunks(path, text)


def _embed_texts(texts: list[str]) -> list[list[float]]:
    """Legacy function - use embed_texts from rag_utils instead."""
    return embed_texts(texts)


def _query_collection(query: str, k: int) -> dict[str, Any]:
    """Legacy function - use query_collection from rag_utils instead."""
    return query_collection(query, k)


def _tokenize(text: str) -> list[str]:
    """Legacy function - use tokenize_text from rag_utils instead."""
    return tokenize_text(text)


def _lexical_overlap_score(q: str, d: str) -> float:
    """Legacy function - use lexical_overlap_score from rag_utils instead."""
    return lexical_overlap_score(q, d)


def _expand_queries(question: str) -> list[str]:
    """Legacy function - use expand_queries from rag_utils instead."""
    return expand_queries(question)


def _detect_article_label(text: str) -> str | None:
    """Legacy function - use detect_article_label from rag_utils instead."""
    return detect_article_label(text)


def _detect_document_title(text: str) -> str | None:
    """Legacy function - use detect_document_title from rag_utils instead."""
    return detect_document_title(text)


# Export main functions and legacy aliases
__all__ = [
    # Main functions
    "RAGInit",
    "_init",
    "answer_question",
    "retrieve",
    "ingest_paths",
    "chunk_by_tokens",
    "embed_texts",
    "encode_text",
    "expand_queries",
    "generate_chunk_id",
    "get_max_embedding_tokens",
    "lexical_overlap_score",
    "process_file_chunks",
    "query_collection",
    "read_file_content",
    "tokenize_text",
    "detect_article_label",
    "detect_document_title",
    # Legacy aliases
    "_encode",
    "_decode",
    "_max_embedding_tokens",
    "_hash_id",
    "_read_file_content",
    "_process_file_chunks",
    "_embed_texts",
    "_query_collection",
    "_tokenize",
    "_lexical_overlap_score",
    "_expand_queries",
    "_detect_article_label",
    "_detect_document_title",
]
