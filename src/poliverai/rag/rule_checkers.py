"""Rule-based compliance checking functions for GDPR verification.

This module contains deterministic rule-based checks for common GDPR
compliance requirements and violations.
"""

from __future__ import annotations

from typing import Any

from ..knowledge.mappings import map_requirement_to_articles


def check_lawful_basis_violations(text_lower: str) -> list[dict[str, Any]]:
    """Check for Article 6 lawful basis violations."""
    lawful_basis_terms = ["lawful basis", "consent", "contract", "legal obligation"]
    if not any(term in text_lower for term in lawful_basis_terms):
        return [
            {
                "article": "Article 6(1)",
                "reason": "No clear lawful basis for processing stated",
                "severity": "high",
            }
        ]
    return []


def check_information_violations(text_lower: str) -> list[dict[str, Any]]:
    """Check for Article 13 information provision violations."""
    violations = []
    required_info = ["purpose", "data controller", "contact"]
    missing_info = [info for info in required_info if info not in text_lower]
    if missing_info:
        violations.append(
            {
                "article": "Article 13",
                "reason": f"Missing required information: {', '.join(missing_info)}",
                "severity": "medium",
            }
        )
    return violations


def check_erasure_violations(text_lower: str) -> list[dict[str, Any]]:
    """Check for Article 17 right to erasure violations."""
    erasure_terms = ["delete", "erasure", "remove data", "right to be forgotten"]
    if not any(term in text_lower for term in erasure_terms):
        return [
            {
                "article": "Article 17",
                "reason": "No mention of data deletion or right to erasure",
                "severity": "medium",
            }
        ]
    return []


def check_storage_violations(text_lower: str) -> list[dict[str, Any]]:
    """Check for Article 5(1)(e) storage limitation violations."""
    retention_terms = ["retention", "how long", "storage period", "delete after"]
    if not any(term in text_lower for term in retention_terms):
        return [
            {
                "article": "Article 5(1)(e)",
                "reason": "No data retention period specified",
                "severity": "medium",
            }
        ]
    return []


def check_automatic_collection_violations(text_lower: str) -> list[dict[str, Any]]:
    """Check for automatic data collection disclosure violations."""
    auto_collect_terms = [
        "automatically collect",
        "automatic collection",
        "may collect automatically",
        "collect automatically",
        "automatically obtained",
        "automatic information",
    ]
    if any(term in text_lower for term in auto_collect_terms):
        disclosure_terms = [
            "automatically collected information includes",
            "types of information automatically collected",
            "automatically collect the following",
            "information collected automatically",
        ]
        if not any(term in text_lower for term in disclosure_terms):
            return [
                {
                    "article": "Article 13(1)(c)",
                    "reason": (
                        "Automatic data collection mentioned but insufficient "
                        "disclosure of what data is collected"
                    ),
                    "severity": "high",
                }
            ]
    return []


def check_data_sharing_violations(text_lower: str) -> list[dict[str, Any]]:
    """Check for data sharing without proper lawful basis."""
    sharing_terms = ["share", "sharing", "disclose", "third party", "third-party"]
    if any(term in text_lower for term in sharing_terms):
        basis_terms = [
            "lawful basis",
            "consent",
            "legitimate interest",
            "legal obligation",
        ]
        if not any(term in text_lower for term in basis_terms):
            return [
                {
                    "article": "Article 6(1)",
                    "reason": "Data sharing mentioned without clear lawful basis",
                    "severity": "high",
                }
            ]
    return []


def check_compliance_fulfillments(text_lower: str) -> list[dict[str, Any]]:
    """Check for positive compliance indicators."""
    fulfills = []

    # General GDPR acknowledgment
    if "gdpr" in text_lower or "data protection regulation" in text_lower:
        fulfills.append({"article": "General Compliance", "reason": "Acknowledges GDPR compliance"})

    # Article 6 fulfillments
    if any(term in text_lower for term in ["consent", "lawful basis", "article 6"]):
        fulfills.append({"article": "Article 6(1)", "reason": "Mentions lawful basis or consent"})

    # Article 13 fulfillments
    if any(term in text_lower for term in ["data controller", "controller"]):
        fulfills.append({"article": "Article 13", "reason": "Identifies data controller"})

    if any(term in text_lower for term in ["contact", "email", "phone"]):
        fulfills.append({"article": "Article 13", "reason": "Provides contact information"})

    # Article 5 and 17 fulfillments
    if any(term in text_lower for term in ["retention", "delete", "deletion", "remove"]):
        fulfills.append(
            {
                "article": "Article 5(1)(e)",
                "reason": "Addresses data retention/deletion",
            }
        )

    if "erasure" in text_lower or "right to be forgotten" in text_lower:
        fulfills.append({"article": "Article 17", "reason": "Mentions right to erasure"})

    return fulfills


def rule_based_compliance_check(text: str) -> dict[str, Any]:
    """Apply deterministic rule-based compliance checks for common GDPR requirements."""
    text_lower = text.lower()

    violations = []
    # Collect all violations using helper functions
    violations.extend(check_lawful_basis_violations(text_lower))
    violations.extend(check_information_violations(text_lower))
    violations.extend(check_erasure_violations(text_lower))
    violations.extend(check_storage_violations(text_lower))
    violations.extend(check_automatic_collection_violations(text_lower))
    violations.extend(check_data_sharing_violations(text_lower))

    # Collect all positive compliance indicators
    fulfills = check_compliance_fulfillments(text_lower)

    return {"violations": violations, "fulfills": fulfills}


def heuristic_judge_clause(
    clause: str, context_items: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    """Provide heuristic judgment when LLM is unavailable."""
    # Map simple keywords to articles as a fallback
    arts = list(map_requirement_to_articles(clause))
    out: list[dict[str, Any]] = []
    for a in arts:
        out.append(
            {
                "article": a,
                "verdict": "unclear",
                "rationale": "Heuristic mapping only; provide an OpenAI API key "
                "for precise judgment.",
                "policy_excerpt": clause[:160],
                "confidence": 0.5,
            }
        )
    return out
