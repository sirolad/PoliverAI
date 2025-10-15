from __future__ import annotations

import hashlib
import logging
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional
import tiktoken

# chromadb is optional at runtime; lazy-importing reduces build-time deps for dev
try:
    import chromadb
    from chromadb.api.models.Collection import Collection
except Exception:  # pragma: no cover - optional dependency
    chromadb = None
    Collection = None
    
import tiktoken
import tempfile
import tarfile
import shutil
from typing import Optional

import chromadb
import tiktoken
from chromadb.api.models.Collection import Collection
from openai import OpenAI
import os

# Optional GCS support (only used when POLIVERAI_CHROMA_GCS_BUCKET is set)
try:
    from google.cloud import storage
except Exception:  # pragma: no cover - optional dependency
    storage = None

from ..core.config import get_settings
from ..ingestion.readers.docx_reader import read_docx_text
from ..ingestion.readers.html_reader import read_html_text
from ..ingestion.readers.pdf_reader import read_pdf_text
from ..knowledge.mappings import map_requirement_to_articles

# Constants
LARGE_DISTANCE_VALUE = 1e9
MAX_LINE_LENGTH_FOR_TITLE = 150
MAX_TITLE_LENGTH = 100
MIN_TITLE_LENGTH = 10
MAX_LINES_TO_CHECK_FOR_TITLE = 5


@dataclass
class RAGInit:
    collection: Optional[Collection]
    client: OpenAI
    enc_name: str


logger = logging.getLogger(__name__)


def _ensure_dirs(path: str) -> None:
    Path(path).mkdir(parents=True, exist_ok=True)


_rag_state: RAGInit | None = None


def _init() -> RAGInit:
    # Access global state - this is necessary for singleton pattern
    global _rag_state  # noqa: PLW0603
    if _rag_state is not None:
        return _rag_state

    settings = get_settings()

    # Chroma persistent client and collection.
    # If a GCS bucket is configured, try to pull a persisted archive into the folder first.
    _ensure_dirs(settings.chroma_persist_dir)

    # GCS-backed sync: bucket name and object name may be provided via settings.
    gcs_bucket: Optional[str] = settings.chroma_gcs_bucket or settings.gcs_bucket or os.getenv("POLIVERAI_CHROMA_GCS_BUCKET")
    gcs_object: Optional[str] = os.getenv("POLIVERAI_CHROMA_GCS_OBJECT")
    if gcs_bucket and not gcs_object:
        # default object name per collection
        gcs_object = f"{settings.chroma_collection}.tar.gz"

    if gcs_bucket and storage is not None:
        try:
            _gcs_download_persist(gcs_bucket, gcs_object, settings.chroma_persist_dir)
        except Exception as e:
            logger.warning("Failed to download chroma persist from GCS: %s", e)
    elif gcs_bucket and storage is None:
        logger.warning("POLIVERAI_CHROMA_GCS_BUCKET set but google-cloud-storage not installed")

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


def _encode(text: str) -> list[int]:
    enc = tiktoken.get_encoding(_init().enc_name)
    return enc.encode(text)


def _decode(tokens: list[int]) -> str:
    enc = tiktoken.get_encoding(_init().enc_name)
    return enc.decode(tokens)


def _max_embedding_tokens(model: str) -> int:
    m = (model or "").lower()
    # Known OpenAI embedding models
    if "text-embedding-3" in m:
        return 8192
    if "text-embedding-ada-002" in m:
        return 8191
    # Default to a safe limit if unknown
    return 8192


def _truncate_for_embedding(text: str, model: str, safety_margin: int = 32) -> str:
    """Truncate input text so its tokenized length fits the embedding model limit."""
    max_tokens = max(1, _max_embedding_tokens(model) - max(0, safety_margin))
    tokens = _encode(text)
    if len(tokens) <= max_tokens:
        return text
    return _decode(tokens[:max_tokens])


def chunk_by_tokens(text: str, chunk_size: int, overlap: int) -> list[str]:
    if chunk_size <= 0:
        return [text]
    tokens = _encode(text)
    chunks: list[str] = []
    step = max(1, chunk_size - max(0, overlap))
    for start in range(0, len(tokens), step):
        window = tokens[start : start + chunk_size]
        if not window:
            break
        chunks.append(_decode(window))
    return chunks


def _hash_id(source: str, chunk_text: str, i: int) -> str:
    # Using SHA-256 instead of SHA-1 for better security
    return hashlib.sha256(f"{source}::{i}::{chunk_text}".encode()).hexdigest()


def _read_text_file(path: str) -> str:
    with open(path, encoding="utf-8", errors="ignore") as f:
        return f.read()


def _detect_article_label(text: str) -> str | None:
    # Try to capture patterns like "Article 5", "Article 5(1)(e)", etc.
    m = re.search(r"Article\s+\d+(?:\([^)]*\))*", text, flags=re.IGNORECASE)
    if m:
        # Normalize casing: capitalize 'Article'
        raw = m.group(0)
        return "Article " + raw.split(None, 1)[1]
    return None


def _detect_document_title(text: str) -> str | None:
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
        body_text_indicators = ["whereas", "having regard", "pursuant", "the commission"]
        if MIN_TITLE_LENGTH <= len(line) <= MAX_TITLE_LENGTH and not any(
            word in line.lower() for word in body_text_indicators
        ):
            return line

    return None


def ingest_paths(paths: list[str]) -> dict[str, Any]:
    """Ingest local file paths (txt/md/pdf/docx/html). Returns stats."""
    s = get_settings()
    _ = _init()

    supported_ext = {".txt", ".md", ".pdf", ".docx", ".html", ".htm"}
    files_ingested = 0
    chunks_ingested = 0
    skipped: list[tuple[str, str]] = []

    # Ensure small cache directory exists to track previously-ingested file SHA hashes
    cache_dir = Path(s.chroma_persist_dir) / '.ingest_cache'
    cache_dir.mkdir(parents=True, exist_ok=True)

    for p in paths:
        ext = Path(p).suffix.lower()
        if ext not in supported_ext:
            skipped.append((p, f"unsupported extension: {ext}"))
            continue
        try:
            if ext in {".txt", ".md"}:
                text = _read_text_file(p)
            elif ext == ".pdf":
                text = read_pdf_text(p)
            elif ext == ".docx":
                text = read_docx_text(p)
            else:  # .html / .htm
                text = read_html_text(p)

            if not text.strip():
                skipped.append((p, "empty file"))
                continue

            chunks = chunk_by_tokens(text, s.chunk_size_tokens, s.chunk_overlap_tokens)
            if not chunks:
                skipped.append((p, "no chunks produced"))
                continue

            # Detect document title from the full text
            doc_title = _detect_document_title(text)

            embeddings = _embed_texts(chunks)
            ids = [_hash_id(os.path.basename(p), c, i) for i, c in enumerate(chunks)]
            metadatas = []
            for i, c in enumerate(chunks):
                md: dict[str, Any] = {"source": os.path.basename(p), "chunk": i}
                if doc_title:
                    md["title"] = doc_title
                art = _detect_article_label(c)
                if art:
                    md["article"] = art
                metadatas.append(md)

            # Store with precomputed embeddings to ensure search works
            # without a separate embedding function
            _init().collection.upsert(
                documents=chunks,
                metadatas=metadatas,
                ids=ids,
                embeddings=embeddings,
            )

            files_ingested += 1
            chunks_ingested += len(chunks)
            # Record sha cache so future identical files are skipped
            try:
                # compute sha of the original file path
                import hashlib

                def _file_sha(path: str) -> str:
                    h = hashlib.sha256()
                    with open(path, 'rb') as fh:
                        for chunk in iter(lambda: fh.read(8192), b''):
                            h.update(chunk)
                    return h.hexdigest()

                sha = _file_sha(p)
                (cache_dir / sha).write_text(f"{Path(p).name}\n{sha}\n")
            except Exception:
                # best-effort cache write; ignore failures
                pass
        except Exception as e:
            skipped.append((p, f"error: {e}"))
            continue

    result = {
        "files": files_ingested,
        "chunks": chunks_ingested,
        "skipped": [{"path": p, "reason": r} for p, r in skipped],
    }

    # If GCS is configured, attempt to upload the updated persist dir.
    gcs_bucket: Optional[str] = os.getenv("POLIVERAI_CHROMA_GCS_BUCKET")
    gcs_object: Optional[str] = os.getenv("POLIVERAI_CHROMA_GCS_OBJECT")
    if gcs_bucket:
        try:
            if not gcs_object:
                gcs_object = f"{get_settings().chroma_collection}.tar.gz"
            # Use upload helper that skips upload if tarball checksum unchanged
            from ..storage.gcs_reports import upload_report_if_changed

            uploaded, gcs_url = upload_report_if_changed(gcs_bucket, gcs_object, get_settings().chroma_persist_dir + "/")
            if not uploaded:
                logger.info("Chroma persist tarball unchanged; skipped GCS upload for %s", gcs_object)
        except Exception as e:
            logger.warning("Failed to upload chroma persist to GCS after ingest: %s", e)

    return result

def _gcs_download_persist(bucket_name: str, object_name: str | None, dest_dir: str) -> bool:
    """Download a tar.gz from GCS and extract into dest_dir. Returns True if downloaded."""
    if storage is None:
        raise RuntimeError("google-cloud-storage is not available")
    if not object_name:
        raise ValueError("object_name is required to download persist")

    # Initialize GCS client, prefer explicit service-account JSON if provided
    creds_path = os.getenv("POLIVERAI_GCS_CREDENTIALS_JSON")
    if creds_path:
        abs_path = creds_path if os.path.isabs(creds_path) else os.path.abspath(creds_path)
        if os.path.exists(abs_path):
            try:
                client = storage.Client.from_service_account_json(abs_path)
            except Exception as e:
                logger.warning("Failed to init GCS client from %s: %s", abs_path, e)
                client = storage.Client()
        else:
            logger.warning("POLIVERAI_GCS_CREDENTIALS_JSON set to %s but file not found; using default client", abs_path)
            client = storage.Client()
    else:
        client = storage.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(object_name)
    if not blob.exists():
        return False

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".tar.gz")
    tmp.close()
    try:
        blob.download_to_filename(tmp.name)
        # Clear dest_dir then extract
        if os.path.exists(dest_dir):
            shutil.rmtree(dest_dir)
        os.makedirs(dest_dir, exist_ok=True)
        with tarfile.open(tmp.name, "r:gz") as tar:
            tar.extractall(path=dest_dir)
        logger.info("Downloaded and extracted chroma persistence from gs://%s/%s", bucket_name, object_name)
        return True
    finally:
        try:
            os.remove(tmp.name)
        except Exception:
            pass


def _gcs_upload_persist(bucket_name: str, object_name: str | None, src_dir: str) -> bool:
    """Create a tar.gz of src_dir and upload to GCS. Returns True on success."""
    if storage is None:
        raise RuntimeError("google-cloud-storage is not available")
    if not object_name:
        raise ValueError("object_name is required to upload persist")
    if not os.path.exists(src_dir):
        raise ValueError("src_dir does not exist: %s" % src_dir)

    # Initialize GCS client, prefer explicit service-account JSON if provided
    creds_path = os.getenv("POLIVERAI_GCS_CREDENTIALS_JSON")
    if creds_path:
        abs_path = creds_path if os.path.isabs(creds_path) else os.path.abspath(creds_path)
        if os.path.exists(abs_path):
            try:
                client = storage.Client.from_service_account_json(abs_path)
            except Exception as e:
                logger.warning("Failed to init GCS client from %s: %s", abs_path, e)
                client = storage.Client()
        else:
            logger.warning("POLIVERAI_GCS_CREDENTIALS_JSON set to %s but file not found; using default client", abs_path)
            client = storage.Client()
    else:
        client = storage.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(object_name)

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".tar.gz")
    tmp.close()
    try:
        with tarfile.open(tmp.name, "w:gz") as tar:
            # Add content of src_dir into tar root
            tar.add(src_dir, arcname=".")
        blob.upload_from_filename(tmp.name)
        logger.info("Uploaded chroma persistence to gs://%s/%s", bucket_name, object_name)
        return True
    finally:
        try:
            os.remove(tmp.name)
        except Exception:
            pass



def _embed_texts(texts: list[str]) -> list[list[float]]:
    s = get_settings()
    init = _init()
    model = s.openai_embedding_model

    # Preprocess to respect maximum tokens per model (best-effort)
    processed: list[str] = []
    try:
        max_tokens = _max_embedding_tokens(model)
    except Exception:
        max_tokens = 8192
    limit = max(1, max_tokens - 32)  # safety margin
    for original_text in texts:
        tokens = _encode(original_text)
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
            processed_text = _decode(tokens[:limit])
        else:
            processed_text = original_text
        processed.append(processed_text)

    # If the configured model is a local sentence-transformers model (prefix)
    if isinstance(model, str) and model.startswith("sentence-transformers/"):
        # Lazy import to avoid requiring sentence-transformers unless used
        try:
            from sentence_transformers import SentenceTransformer
        except Exception as e:  # pragma: no cover - optional dependency
            # If sentence-transformers isn't installed, try to fall back to OpenAI
            # embeddings if an API key is configured. This prevents a hard failure
            # in streaming/ingest when local embeddings aren't available.
            logger.warning(
                "sentence-transformers not available: %s. Falling back to OpenAI embeddings if configured.",
                str(e),
            )
            s = get_settings()
            if s.openai_api_key:
                # Use OpenAI embeddings for the processed texts
                init = _init()
                # If the configured embedding model points to a sentence-transformers path,
                # replace it with a valid OpenAI embedding model for the fallback case.
                model_to_use = s.openai_embedding_model
                if isinstance(model_to_use, str) and model_to_use.startswith("sentence-transformers/"):
                    logger.warning(
                        "Configured POLIVERAI_OPENAI_EMBEDDING_MODEL appears to reference a local sentence-transformers model (%s). Using default OpenAI embedding 'text-embedding-3-small' as fallback.",
                        model_to_use,
                    )
                    model_to_use = "text-embedding-3-small"
                try:
                    resp = init.client.embeddings.create(model=model_to_use, input=processed)
                    return [d.embedding for d in resp.data]
                except Exception as oe:
                    raise RuntimeError("Failed to compute OpenAI embeddings as fallback: %s" % oe) from oe
            else:
                raise RuntimeError(
                    "sentence-transformers is not installed and OpenAI API key is not configured. Install sentence-transformers or set POLIVERAI_OPENAI_API_KEY."
                ) from e

        # Simple cache to avoid reloading the model repeatedly
        if not hasattr(_embed_texts, "_local_cache"):
            setattr(_embed_texts, "_local_cache", {})
        cache = getattr(_embed_texts, "_local_cache")
        model_key = model
        if model_key not in cache:
            # model string: 'sentence-transformers/all-MiniLM-L6-v2' -> use 'all-MiniLM-L6-v2'
            _, local_name = model.split("/", 1)
            cache[model_key] = SentenceTransformer(local_name)

        embedder = cache[model_key]
        # sentence-transformers returns numpy arrays by default; convert to lists
        emb = embedder.encode(processed, show_progress_bar=False)
        return [list(map(float, e)) for e in emb]

    # Otherwise, fall back to OpenAI embeddings via the OpenAI client
    if not s.openai_api_key:
        raise RuntimeError(
            "OpenAI API key not set. Please export POLIVERAI_OPENAI_API_KEY or set it in .env."
        )

    resp = init.client.embeddings.create(model=model, input=processed)
    return [d.embedding for d in resp.data]


def _query_collection(query: str, k: int) -> dict[str, Any]:
    init = _init()
    qv = _embed_texts([query])[0]
    # Note: older/newer Chroma versions don't accept "ids" in include; ids are returned by default.
    return init.collection.query(
        query_embeddings=[qv],
        n_results=k,
        include=["documents", "metadatas", "distances"],
    )  # type: ignore[arg-type]


def _tokenize(text: str) -> list[str]:
    # Simple alnum tokens
    return [t for t in re.split(r"[^a-z0-9]+", text.lower()) if t]


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


def _lexical_overlap_score(q: str, d: str) -> float:
    qt = [t for t in _tokenize(q) if t not in _STOP]
    dt = [t for t in _tokenize(d) if t not in _STOP]
    if not qt or not dt:
        return 0.0
    qs = set(qt)
    ds = set(dt)
    inter = len(qs & ds)
    union = len(qs | ds)
    if union == 0:
        return 0.0
    return inter / union


def _expand_queries(question: str) -> list[str]:
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


def retrieve(query: str, k: int | None = None) -> list[dict[str, Any]]:
    s = get_settings()
    k = k or s.top_k

    # If no key, cannot embed; return empty to allow fallbacks
    if not s.openai_api_key:
        return []

    queries = _expand_queries(query)

    # Aggregate results across expanded queries, keeping best (lowest) distance per id
    by_id: dict[str, dict[str, Any]] = {}
    for q in queries:
        res = _query_collection(q, max(k, s.top_k))
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
        lex = _lexical_overlap_score(query, rec.get("doc", ""))
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
            return {"answer": "No context available. Please ingest documents first.", "sources": []}
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
            {"role": "system", "content": "You are PoliverAI, a careful compliance assistant."},
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
