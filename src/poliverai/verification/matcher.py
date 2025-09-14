from ..domain.models import Clause, ClauseMatch


def match_clause_to_gdpr(clause: Clause) -> list[ClauseMatch]:
    # Placeholder matcher
    matches: list[ClauseMatch] = []
    text = clause.text.lower()
    if "retention" in text:
        matches.append(ClauseMatch(clause=clause, article="Article 5(1)(e)", score=0.6))
    if "erasure" in text or "deletion" in text:
        matches.append(ClauseMatch(clause=clause, article="Article 17", score=0.55))
    return matches