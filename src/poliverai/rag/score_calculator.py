"""Score calculation and verdict determination for GDPR compliance analysis.

This module handles the calculation of compliance scores and determination of
compliance verdicts based on violations and fulfillments found during analysis.
"""

from __future__ import annotations

from typing import Any

# Compliance score thresholds
FULLY_COMPLIANT_THRESHOLD = 75
PARTIALLY_COMPLIANT_THRESHOLD = 35
MAX_VIOLATIONS_FOR_COMPLIANT = 1
MAX_VIOLATIONS_FOR_PARTIAL = 3
MAX_CRITICAL_FOR_PARTIAL = 2

# Severity thresholds for findings
HIGH_SEVERITY_THRESHOLD = 3
MEDIUM_SEVERITY_THRESHOLD = 2
CRITICAL_VIOLATIONS_MAJOR = 2
TOTAL_VIOLATIONS_THRESHOLD = 5

# Score adjustment constants
SEVERE_VIOLATIONS_SCORE_CAP = 25
CRITICAL_VIOLATIONS_SCORE_CAP = 40

# Evidence count thresholds
HIGH_EVIDENCE_THRESHOLD = 10
MODERATE_EVIDENCE_THRESHOLD = 5

# Document analysis thresholds
PARTIAL_COMPLIANT_SCORE_THRESHOLD = 40
MIN_VIOLATIONS_FOR_PARTIAL = 2
MIN_FULFILLS_FOR_PARTIAL = 2
DOCUMENT_LENGTH_SUBSTANTIAL = 500
DOCUMENT_LENGTH_MODERATE = 200


def calculate_score_and_verdict(
    article_violations: dict[str, int], article_fulfills: dict[str, int]
) -> tuple[int, str]:
    """Calculate compliance score and verdict from violations and fulfillments.

    Args:
        article_violations: Count of violations per article
        article_fulfills: Count of fulfillments per article

    Returns:
        Tuple of (score, verdict) where score is 0-100 and verdict is one of:
        'compliant', 'partially_compliant', 'non_compliant'
    """
    total_violations = sum(article_violations.values())
    critical_articles = ["Article 6(1)", "Article 13", "Article 5(1)(e)"]
    critical_violations = sum(1 for art in critical_articles if art in article_violations)

    # Base score calculation - start higher for better baseline
    base_score = 85  # Start from a good baseline

    # Deduct points for violations (more severe penalties for critical articles)
    for article, count in article_violations.items():
        if article in critical_articles:
            base_score -= count * 20  # Critical violations have higher penalty
        else:
            base_score -= count * 10  # Regular violations

    # Add points for fulfillments (smaller bonus to keep violations impactful)
    for count in article_fulfills.values():
        base_score += count * 3

    # Ensure score is within bounds
    score = max(0, min(100, base_score))

    # Determine verdict based primarily on score with violation safeguards
    # If there are severe violations, adjust verdict regardless of score
    if (
        critical_violations > CRITICAL_VIOLATIONS_MAJOR
        or total_violations > TOTAL_VIOLATIONS_THRESHOLD
    ):
        # Too many violations - force non-compliant regardless of score
        adjusted_score = min(score, SEVERE_VIOLATIONS_SCORE_CAP)
        return adjusted_score, "non_compliant"
    elif critical_violations > 0 and total_violations > CRITICAL_VIOLATIONS_MAJOR:
        # Some critical violations - likely non-compliant
        adjusted_score = min(score, CRITICAL_VIOLATIONS_SCORE_CAP)
        return adjusted_score, "non_compliant"
    elif score >= FULLY_COMPLIANT_THRESHOLD and critical_violations == 0:
        # High score with no critical violations
        return score, "compliant"
    elif score >= PARTIALLY_COMPLIANT_THRESHOLD:
        # Moderate score
        return score, "partially_compliant"
    else:
        # Low score
        return score, "non_compliant"


def get_compliance_summary(
    verdict: str, score: int, critical_violations: int, total_violations: int
) -> str:
    """Generate a human-readable compliance summary."""
    if verdict == "compliant":
        return f"Policy meets GDPR requirements with score {score}/100."
    elif verdict == "partially_compliant":
        if critical_violations > 0:
            return (
                f"Policy addresses most GDPR requirements (score {score}/100) but has "
                f"{critical_violations} critical issue(s) that need attention."
            )
        else:
            return (
                f"Policy covers key GDPR requirements (score {score}/100) with "
                f"{total_violations} minor issue(s) to resolve."
            )
    else:
        return (
            f"Policy has significant GDPR compliance gaps (score {score}/100) "
            f"requiring immediate attention."
        )


def generate_findings_and_recommendations(
    article_violations: dict[str, int],
    article_severity_map: dict[str, str] = None,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Generate findings and recommendations from violations.

    Args:
        article_violations: Count of violations per article
        article_severity_map: Optional mapping of articles to their rule-based severity levels

    Returns:
        Tuple of (findings, recommendations) lists
    """
    from ..knowledge.gdpr_articles import get_article_with_title

    findings: list[dict[str, Any]] = []
    recommendations: list[dict[str, Any]] = []
    article_severity_map = article_severity_map or {}

    def _severity(count: int) -> str:
        """Determine severity based on violation count."""
        if count >= HIGH_SEVERITY_THRESHOLD:
            return "high"
        if count == MEDIUM_SEVERITY_THRESHOLD:
            return "medium"
        return "low"

    for art, cnt in article_violations.items():
        # Use preserved severity from rule-based analysis if available,
        # otherwise calculate from count
        severity = article_severity_map.get(art, _severity(cnt))

        # Get the full article title for better display
        article_with_title = get_article_with_title(art)

        findings.append(
            {
                "article": article_with_title,  # Now includes full title
                "issue": f"Potential non-compliance with {article_with_title}",
                "severity": severity,
                "confidence": 0.6,
            }
        )

        # Generate specific recommendations based on article
        recommendation = _get_article_recommendation(art, article_with_title)
        if recommendation:
            recommendations.append(recommendation)

    return findings, recommendations


def _get_article_recommendation(article: str, article_with_title: str) -> dict[str, Any]:
    """Get specific recommendation for an article violation."""
    recommendations_map = {
        "Article 6(1)": {
            "title": "Establish Clear Lawful Basis",
            "description": (
                "Clearly state the lawful basis for processing personal data "
                "(consent, contract, legal obligation, etc.)"
            ),
            "priority": "high",
        },
        "Article 13": {
            "title": "Provide Required Information",
            "description": (
                "Include data controller identity, contact details, and processing "
                "purposes as required by GDPR"
            ),
            "priority": "high",
        },
        "Article 5(1)(e)": {
            "title": "Define Data Retention Period",
            "description": (
                "Specify how long personal data will be stored and establish deletion procedures"
            ),
            "priority": "medium",
        },
        "Article 17": {
            "title": "Address Right to Erasure",
            "description": "Explain users' right to request deletion of their personal data",
            "priority": "medium",
        },
        "Article 13(1)(c)": {
            "title": "Improve Data Collection Disclosure",
            "description": "Clearly explain what data is automatically collected and how it's used",
            "priority": "high",
        },
    }

    recommendation = recommendations_map.get(article)
    if recommendation:
        return {
            "article": article_with_title,
            "title": recommendation["title"],
            "description": recommendation["description"],
            "priority": recommendation["priority"],
        }

    # Generic recommendation for other articles
    return {
        "article": article_with_title,
        "title": f"Address {article} Compliance",
        "description": f"Review and improve compliance with {article_with_title} requirements",
        "priority": "medium",
    }


def calculate_analysis_confidence(
    analysis_mode: str,
    have_key: bool,
    all_evidence: list[dict[str, Any]],
    clauses: list[str],
    skip_expensive_processing: bool,
) -> float:
    """Calculate confidence score for the analysis based on various factors."""
    confidence = 0.5  # Base confidence

    # Adjust based on analysis mode
    if analysis_mode == "detailed":
        confidence += 0.3
    elif analysis_mode == "balanced":
        confidence += 0.2
    else:  # fast mode
        confidence += 0.1

    # Adjust based on whether we have an API key for LLM analysis
    if have_key and not skip_expensive_processing:
        confidence += 0.2

    # Adjust based on amount of evidence gathered
    evidence_count = len(all_evidence)
    if evidence_count > HIGH_EVIDENCE_THRESHOLD:
        confidence += 0.1
    elif evidence_count > MODERATE_EVIDENCE_THRESHOLD:
        confidence += 0.05

    # Adjust based on document length (more content = higher confidence)
    total_text_length = sum(len(clause) for clause in clauses)
    if total_text_length > DOCUMENT_LENGTH_SUBSTANTIAL:
        confidence += 0.1
    elif total_text_length > DOCUMENT_LENGTH_MODERATE:
        confidence += 0.05

    # Ensure confidence is within bounds
    return min(1.0, max(0.0, confidence))
