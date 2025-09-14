from poliverai.retrieval.search import build_and_search


def test_build_and_search() -> None:
    corpus = ["data retention policy", "right to erasure", "cookies policy"]
    results = build_and_search(corpus, query="retention")
    assert isinstance(results, list)
    assert results