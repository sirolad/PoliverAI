from typing import Literal, TypedDict


class ScoreBreakdown(TypedDict):
    clause_match: float
    recommendations: float


Severity = Literal["low", "medium", "high", "critical"]
Verdict = Literal["compliant", "non_compliant"]
