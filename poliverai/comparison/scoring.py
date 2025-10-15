def compare_scores(a_score: int, b_score: int) -> str:
    if a_score == b_score:
        return "equal"
    return "a" if a_score > b_score else "b"
