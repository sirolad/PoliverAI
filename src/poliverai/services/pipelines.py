from ..domain.models import ComplianceReport


def verify_policy(text: str) -> ComplianceReport:  # type: ignore[override]
    """Placeholder pipeline that returns an empty report."""
    return ComplianceReport(score=50, confidence=0.5)