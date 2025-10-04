from collections.abc import Iterable


def map_requirement_to_articles(requirement: str) -> Iterable[str]:
    # Placeholder keyword mapping
    req = requirement.lower()
    if "retention" in req:
        return ["Article 5(1)(e)"]
    if "erasure" in req or "deletion" in req:
        return ["Article 17"]
    if "lawful" in req or "consent" in req:
        return ["Article 6"]
    return []
