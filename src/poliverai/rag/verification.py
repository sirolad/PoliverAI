"""GDPR compliance verification - main interface.

This module provides the main entry point for GDPR compliance verification.
The actual implementation has been modularized for better maintainability.
"""

from __future__ import annotations

# Re-export the main analysis function from the new modular structure
from .compliance_analyzer import analyze_policy

# Re-export other commonly used functions for backward compatibility
from .llm_handlers import llm_judge_clause
from .rule_checkers import heuristic_judge_clause, rule_based_compliance_check
from .score_calculator import (
    calculate_score_and_verdict,
    generate_findings_and_recommendations,
    get_compliance_summary,
)

__all__ = [
    "analyze_policy",
    "llm_judge_clause",
    "heuristic_judge_clause",
    "rule_based_compliance_check",
    "calculate_score_and_verdict",
    "generate_findings_and_recommendations",
    "get_compliance_summary",
]
