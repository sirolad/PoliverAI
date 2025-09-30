from functools import lru_cache


@lru_cache(maxsize=128)
def cached_answer(question: str) -> str:
    return f"Cached placeholder answer for: {question}"
