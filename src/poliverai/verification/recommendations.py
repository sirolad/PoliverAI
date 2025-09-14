from ...domain.models import Finding


def suggest(findings: list[Finding]) -> list[str]:
    # Placeholder recommendations derived from findings
    recs: list[str] = []
    for f in findings:
        if f.article.startswith("Article 5"):
            recs.append("Add explicit time limits to your retention policy.")
        elif f.article.startswith("Article 17"):
            recs.append("Document user right to erasure and how to request it.")
    return recs