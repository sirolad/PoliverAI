def embed(texts: list[str]) -> list[list[float]]:
    # Placeholder deterministic embedding (not meaningful)
    return [[float((sum(map(ord, t)) % 100) / 100.0)] for t in texts]
