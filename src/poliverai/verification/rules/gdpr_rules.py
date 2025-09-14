from ..explanations import explain_finding
from ...domain.models import Clause, Finding


def check_retention_limits(clause: Clause) -> list[Finding]:
    findings: list[Finding] = []
    if "retention" in clause.text.lower() and "month" not in clause.text.lower() and "year" not in clause.text.lower():
        findings.append(
            Finding(
                article="Article 5(1)(e)",
                description="Retention policy missing time limits.",
                severity="medium",
                confidence=0.7,
            )
        )
    return findings


def run_all_rules(clauses: list[Clause]) -> list[Finding]:
    out: list[Finding] = []
    for c in clauses:
        out.extend(check_retention_limits(c))
    return out