from .embedder import embed
from .index import SimpleIndex


def build_and_search(corpus: list[str], query: str, top_k: int = 5) -> list[str]:
    idx = SimpleIndex()
    for t, v in zip(corpus, embed(corpus)):
        idx.add(t, v)
    qv = embed([query])[0]
    return idx.search(qv, top_k=top_k)