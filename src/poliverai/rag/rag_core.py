"""RAG core functionality for document retrieval and question answering.

This module contains the main RAG functionality including initialization,
retrieval, and question answering capabilities.
"""

from __future__ import annotations

import hashlib
import logging
from dataclasses import dataclass
from typing import Any

import chromadb
from chromadb.api.models.Collection import Collection
from openai import OpenAI

from ..core.config import get_settings
from ..knowledge.mappings import map_requirement_to_articles
from .rag_utils import (
    expand_queries,
    lexical_overlap_score,
    query_collection,
)

# Constants
LARGE_DISTANCE_VALUE = 1e9

logger = logging.getLogger(__name__)


@dataclass
class RAGInit:
    """RAG initialization container."""

    collection: Collection
    client: OpenAI
    enc_name: str


# Global state for singleton pattern
_rag_state: RAGInit | None = None


def _init() -> RAGInit:
    """Initialize RAG system with singleton pattern."""
    # Access global state - this is necessary for singleton pattern
    global _rag_state  # noqa: PLW0603
    if _rag_state is not None:
        return _rag_state

    settings = get_settings()

    # Chroma persistent client and collection
    from pathlib import Path

    Path(settings.chroma_persist_dir).mkdir(parents=True, exist_ok=True)
    client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
    collection = client.get_or_create_collection(name=settings.chroma_collection)

    # OpenAI client
    if not settings.openai_api_key:
        # Defer hard failure until we attempt to call the API, but warn here in logs
        # to surface quickly in development.
        pass
    oa_kwargs: dict[str, Any] = {}
    if settings.openai_api_key:
        oa_kwargs["api_key"] = settings.openai_api_key
    if settings.openai_base_url:
        oa_kwargs["base_url"] = settings.openai_base_url
    oa_client = OpenAI(**oa_kwargs)

    # Tokenizer
    enc_name = "cl100k_base"
    _rag_state = RAGInit(collection=collection, client=oa_client, enc_name=enc_name)
    return _rag_state


def retrieve(query: str, k: int | None = None) -> list[dict[str, Any]]:
    """Retrieve relevant documents for a query using hybrid search."""
    s = get_settings()
    k = k or s.top_k

    # If no key, cannot embed; return empty to allow fallbacks
    if not s.openai_api_key:
        return []

    queries = expand_queries(query)

    # Aggregate results across expanded queries, keeping best (lowest) distance per id
    by_id: dict[str, dict[str, Any]] = {}
    for q in queries:
        res = query_collection(q, max(k, s.top_k))
        docs = (res.get("documents") or [[]])[0]
        metas = (res.get("metadatas") or [[]])[0]
        dists = (res.get("distances") or [[]])[0]
        ids_outer = res.get("ids") or [[]]
        ids = ids_outer[0] if ids_outer and len(ids_outer) > 0 else None
        for idx, (d, m, dist) in enumerate(zip(docs, metas, dists, strict=False)):
            # Use Chroma id if present, else synthesize a stable id from content + metadata
            if ids is not None and idx < len(ids):
                _id = ids[idx]
            else:
                meta = m or {}
                _id = hashlib.sha256(
                    (
                        (d or "")
                        + "|"
                        + str(meta.get("source", ""))
                        + "|"
                        + str(meta.get("chunk", ""))
                    ).encode("utf-8")
                ).hexdigest()
            if not _id:
                continue
            prev = by_id.get(_id)
            score = float(dist) if dist is not None else 1e9
            # Keep minimal distance
            if prev is None or score < prev.get("distance", 1e9):
                by_id[_id] = {"id": _id, "doc": d, "meta": m or {}, "distance": score}

    # Compute hybrid score
    vw = s.retrieval_vector_weight
    lw = s.retrieval_lexical_weight
    ab = s.retrieval_article_boost

    for rec in by_id.values():
        dist = rec.get("distance", 1e9)
        vec_sim = 1.0 / (1.0 + float(dist)) if dist < LARGE_DISTANCE_VALUE else 0.0
        lex = lexical_overlap_score(query, rec.get("doc", ""))
        art = (rec.get("meta") or {}).get("article")
        art_hit = False
        for a in map_requirement_to_articles(query):
            if art and a.lower() in art.lower():
                art_hit = True
                break
        rec["score"] = vw * vec_sim + lw * lex + (ab if art_hit else 0.0)

    merged = sorted(by_id.values(), key=lambda r: r.get("score", 0.0), reverse=True)[:k]
    return merged


def answer_question(question: str) -> dict[str, Any]:
    """Answer a question using RAG retrieval and generation."""
    s = get_settings()
    if not question.strip():
        return {"answer": "Please provide a question.", "sources": []}

    context_items = []
    sources: list[dict[str, Any]] = []

    # Use hybrid retrieval and allow more context
    try:
        items = retrieve(question, k=max(s.top_k * 2, 8))
    except Exception as e:
        return {
            "answer": (
                "I couldn't access the vector store. Try ingesting documents first "
                "or check the server logs.\n"
                f"Details: {e}"
            ),
            "sources": [],
        }

    if not items:
        return {
            "answer": "I don't have any context ingested yet. "
            "Please upload some documents on the Ingest tab.",
            "sources": [],
        }

    for i, it in enumerate(items):
        md = it.get("meta", {}) or {}
        doc = it.get("doc", "")
        src = md.get("source", f"doc-{i}")
        ch = md.get("chunk", i)
        art = md.get("article")
        title = md.get("title")
        context_items.append(f"[source={src} chunk={ch}{' article=' + art if art else ''}]\n{doc}")
        src_entry = {"source": src, "chunk": ch, "snippet": doc[:300]}
        if title:
            src_entry["title"] = title
        if art:
            src_entry["article"] = art
        sources.append(src_entry)

    context = "\n\n".join(context_items)
    prompt = (
        "You are PoliverAI, a compliance assistant. "
        "Use the provided context to answer the user's question. "
        "If the context is only partially relevant, "
        "give the best evidence-backed answer and explicitly note uncertainties. "
        "Only reply 'I don't know' "
        "if none of the context is relevant.\n\n"
        f"Question: {question}\n\nContext:\n{context}\n\nAnswer (cite articles when possible):"
    )

    init = _init()
    if not s.openai_api_key:
        # If no key set, return a brief summary from top snippets
        if not sources:
            return {
                "answer": "No context available. Please ingest documents first.",
                "sources": [],
            }
        joined = "\n\n".join([x["snippet"] for x in sources[:5]])
        return {
            "answer": (
                "OpenAI key not configured. Based on the retrieved excerpts, "
                "here are relevant snippets:\n\n" + joined
            ),
            "sources": sources,
        }

    chat = init.client.chat.completions.create(
        model=s.openai_chat_model,
        messages=[
            {
                "role": "system",
                "content": "You are PoliverAI, a careful compliance assistant.",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
    )
    answer = (chat.choices[0].message.content or "").strip()

    # Final safeguard: if the model still refuses, provide a sources-based guidance
    lowered = answer.lower()
    if ("don't know" in lowered or "do not know" in lowered) and sources:
        arts = sorted({s.get("article", "") for s in sources if s.get("article")})
        suffix = (" Relevant articles: " + ", ".join(arts)) if arts else ""
        answer = (
            "From the retrieved GDPR excerpts, here are the closest relevant requirements."
            + suffix
            + " If this doesn't answer your question, try asking with "
            + "specific article names or terms."
        )

    return {"answer": answer, "sources": sources}
