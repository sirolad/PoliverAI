from ...domain.models import Clause, Finding


def check_retention_limits(clause: Clause) -> list[Finding]:
    findings: list[Finding] = []
    text_lower = clause.text.lower()
    if "retention" in text_lower and "month" not in text_lower and "year" not in text_lower:
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
