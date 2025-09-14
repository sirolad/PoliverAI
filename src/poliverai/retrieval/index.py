from typing import List, Tuple


class SimpleIndex:
    def __init__(self) -> None:
        self.items: List[Tuple[str, List[float]]] = []

    def add(self, text: str, vector: List[float]) -> None:
        self.items.append((text, vector))

    def search(self, query_vec: List[float], top_k: int = 5) -> List[str]:
        # Placeholder: naive sort by abs difference to first dim
        results = sorted(self.items, key=lambda x: abs(x[1][0] - query_vec[0]))
        return [t for t, _ in results[:top_k]]