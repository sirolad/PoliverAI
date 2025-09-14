from ...domain.models import Finding


def score_findings(findings: list[Finding]) -> tuple[int, float]:
    # Placeholder scoring: fewer findings => higher score
    base = 85
    penalty = min(60, 10 * len(findings))
    score = max(0, base - penalty)
    confidence = 0.6 if findings else 0.7
    return score, confidence