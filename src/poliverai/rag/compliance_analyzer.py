"""Main compliance analyzer that orchestrates GDPR policy analysis.

This module coordinates the analysis of policy documents for GDPR compliance,
integrating rule-based checks, LLM analysis, and scoring mechanisms.
"""

from __future__ import annotations

import logging
from typing import Any

from ..core.config import get_settings
from ..core.exceptions import VerificationError
from ..knowledge.gdpr_articles import get_article_with_title
from ..preprocessing.segment import split_into_paragraphs
from .llm_handlers import llm_judge_clause
from .rule_checkers import heuristic_judge_clause, rule_based_compliance_check
from .score_calculator import (
    calculate_analysis_confidence,
    calculate_score_and_verdict,
    generate_findings_and_recommendations,
    get_compliance_summary,
)
from .service import retrieve

# Constants for verification
MIN_MEANINGFUL_WORDS = 5
MAX_CLAUSES_TO_PROCESS = 50
MIN_WORDS_FOR_LLM_PROCESSING = 20
FAST_MODE_SCORE_THRESHOLD = 60  # Skip expensive processing if rule-based score is already good
MIN_CLAUSES_FOR_ANALYSIS = 3  # Minimum clauses required for meaningful analysis

# Performance optimization constants
MAX_LLM_CLAUSES = 5  # Limit expensive LLM processing to most important clauses


def add_rule_based_evidence(
    rule_based: dict[str, Any],
    all_evidence: list[dict[str, Any]],
    article_violations: dict[str, int],
    article_fulfills: dict[str, int],
) -> dict[str, str]:
    """Add rule-based evidence to the collections.

    Returns:
        dict: Article to severity mapping for preserving original severity levels
    """
    article_severity_map = {}

    # Add rule-based violations
    for violation in rule_based["violations"]:
        article = violation["article"]
        article_violations[article] = article_violations.get(article, 0) + 1
        article_severity_map[article] = violation["severity"]  # Preserve original severity

        # Format article with title for better display
        article_with_title = get_article_with_title(article)

        all_evidence.append(
            {
                "article": article_with_title,  # Now includes full title
                "policy_excerpt": f"Rule-based check: {violation['reason']}",
                "score": 0.8,
                "verdict": "violates",
                "rationale": violation["reason"],
            }
        )

    # Add rule-based fulfills
    for fulfill in rule_based["fulfills"]:
        article_fulfills[fulfill["article"]] = article_fulfills.get(fulfill["article"], 0) + 1
        # Format article with title for better display
        article_with_title = get_article_with_title(fulfill["article"])

        all_evidence.append(
            {
                "article": article_with_title,  # Now includes full title
                "policy_excerpt": fulfill["reason"],
                "score": 0.8,
                "verdict": "fulfills",
                "rationale": fulfill["reason"],
            }
        )

    return article_severity_map


def process_clauses(
    clauses: list[str],
    have_key: bool,
    s,
    collections: dict[str, Any],
) -> None:
    """Process clauses with optimized LLM or heuristic judgment."""
    all_evidence = collections["all_evidence"]
    article_violations = collections["article_violations"]
    article_fulfills = collections["article_fulfills"]

    # Performance optimization: prioritize longer, more substantial clauses for LLM processing
    sorted_clauses = sorted(clauses, key=lambda x: -len(x.split()))
    llm_processed_count = 0

    for clause in sorted_clauses:
        try:
            # Smart LLM usage: only process the most substantial clauses with LLM
            should_use_llm = (
                have_key
                and len(clause.split()) > MIN_WORDS_FOR_LLM_PROCESSING
                and llm_processed_count < MAX_LLM_CLAUSES
            )

            if should_use_llm:
                try:
                    ctx = retrieve(clause, k=s.top_k)
                    if ctx:
                        judgments = llm_judge_clause(clause, ctx)
                        llm_processed_count += 1
                    else:
                        judgments = heuristic_judge_clause(clause, [])
                except Exception as e:
                    # Fallback to heuristic if LLM fails
                    logging.warning(f"LLM processing failed, using heuristic: {e}")
                    judgments = heuristic_judge_clause(clause, [])
            else:
                judgments = heuristic_judge_clause(clause, [])

        except Exception:
            judgments = heuristic_judge_clause(clause, [])

        for j in judgments:
            art = j.get("article", "")
            verdict = j.get("verdict", "unclear")
            conf = float(j.get("confidence", 0.5))
            excerpt = j.get("policy_excerpt") or clause[:200]

            # Format article with title for better display
            article_with_title = get_article_with_title(art)

            all_evidence.append(
                {
                    "article": article_with_title,  # Now includes full title
                    "policy_excerpt": excerpt,
                    "score": round(max(0.0, min(1.0, conf)), 2),
                    "verdict": verdict,
                    "rationale": j.get("rationale", ""),
                }
            )
            if verdict == "violates":
                article_violations[art] = article_violations.get(art, 0) + 1
            elif verdict == "fulfills":
                article_fulfills[art] = article_fulfills.get(art, 0) + 1


def setup_analysis_mode(
    analysis_mode: str, clauses: list[str], rule_based_score: int, have_key: bool
) -> bool:
    """Determine processing strategy based on analysis mode and conditions."""
    # Fast mode: only rule-based
    if analysis_mode == "fast":
        return True

    # If rule-based score is already good, skip expensive processing
    if rule_based_score >= FAST_MODE_SCORE_THRESHOLD:
        return True

    # If no API key available, fallback to rule-based
    if not have_key:
        return True

    # If document is too short for meaningful analysis
    if len(clauses) < MIN_CLAUSES_FOR_ANALYSIS:
        return True

    return False


def perform_clause_analysis(
    skip_expensive_processing: bool,
    analysis_mode: str,
    clauses: list[str],
    have_key: bool,
    s,
) -> tuple[list[dict[str, Any]], dict[str, int], dict[str, int]]:
    """Perform clause-by-clause analysis based on analysis mode."""
    all_evidence: list[dict[str, Any]] = []
    article_violations: dict[str, int] = {}
    article_fulfills: dict[str, int] = {}

    if not skip_expensive_processing and analysis_mode in ("balanced", "detailed"):
        collections = {
            "all_evidence": all_evidence,
            "article_violations": article_violations,
            "article_fulfills": article_fulfills,
        }

        # Filter clauses based on analysis mode
        if analysis_mode == "balanced":
            # Process only the most substantial clauses
            filtered_clauses = [
                c for c in clauses if len(c.split()) > MIN_WORDS_FOR_LLM_PROCESSING
            ][:MAX_LLM_CLAUSES]
        else:  # detailed
            # Process all meaningful clauses
            filtered_clauses = clauses

        process_clauses(filtered_clauses, have_key, s, collections)

        # Update evidence counts
        for evidence in all_evidence:
            art = evidence.get("article", "").split(" - ")[0]  # Extract base article number
            verdict = evidence.get("verdict", "unclear")

            if verdict == "violates":
                article_violations[art] = article_violations.get(art, 0) + 1
            elif verdict == "fulfills":
                article_fulfills[art] = article_fulfills.get(art, 0) + 1

    return all_evidence, article_violations, article_fulfills


def build_final_results(
    analysis_data: dict[str, Any],
    analysis_mode: str,
    have_key: bool,
    clauses: list[str],
    skip_expensive_processing: bool,
) -> dict[str, Any]:
    """Build the final analysis results."""
    article_violations = analysis_data["article_violations"]
    article_fulfills = analysis_data["article_fulfills"]
    article_severity_map = analysis_data["article_severity_map"]
    all_evidence = analysis_data["all_evidence"]

    # Generate findings and recommendations
    findings, recommendations = generate_findings_and_recommendations(
        article_violations, article_severity_map
    )

    # Calculate score and verdict
    score, verdict = calculate_score_and_verdict(article_violations, article_fulfills)

    # Calculate additional metrics
    total_violations = sum(article_violations.values())
    total_fulfills = sum(article_fulfills.values())
    critical_articles = ["Article 6(1)", "Article 13", "Article 5(1)(e)"]
    critical_violations = sum(1 for art in critical_articles if art in article_violations)

    # Generate compliance summary
    compliance_summary = get_compliance_summary(
        verdict, score, critical_violations, total_violations
    )

    # Get top evidence
    evidence_sorted = sorted(
        all_evidence,
        key=lambda e: (1 if e.get("verdict") == "fulfills" else 0, e.get("score", 0.0)),
        reverse=True,
    )
    top_evidence = [
        {k: v for k, v in e.items() if k in {"article", "policy_excerpt", "score"}}
        for e in evidence_sorted[:10]
    ]

    # Calculate confidence
    confidence = calculate_analysis_confidence(
        analysis_mode, have_key, all_evidence, clauses, skip_expensive_processing
    )

    return {
        "verdict": verdict,
        "score": score,
        "confidence": confidence,
        "evidence": top_evidence,
        "findings": findings,
        "recommendations": recommendations,
        "summary": compliance_summary,
        "metrics": {
            "total_violations": total_violations,
            "total_fulfills": total_fulfills,
            "critical_violations": critical_violations,
        },
    }


def analyze_policy(text: str, analysis_mode: str = "fast") -> dict[str, Any]:
    """Analyze a policy text for GDPR compliance.

    Args:
        text: Policy text to analyze
        analysis_mode: Analysis depth - 'fast', 'balanced', or 'detailed'
    """
    try:
        if not text or not text.strip():
            raise VerificationError("Cannot analyze empty policy text")

        s = get_settings()
        clauses = [c.text for c in split_into_paragraphs(text)]
        clauses = [c for c in clauses if len(c.split()) >= MIN_MEANINGFUL_WORDS][
            :MAX_CLAUSES_TO_PROCESS
        ]

        # First apply rule-based checks for deterministic baseline
        rule_based = rule_based_compliance_check(text)

        all_evidence: list[dict[str, Any]] = []
        article_violations: dict[str, int] = {}
        article_fulfills: dict[str, int] = {}

        # Add rule-based evidence and preserve severity mapping
        article_severity_map = add_rule_based_evidence(
            rule_based, all_evidence, article_violations, article_fulfills
        )

        # Check if rule-based analysis is sufficient
        rule_based_score, _ = calculate_score_and_verdict(article_violations, article_fulfills)
        have_key = bool(s.openai_api_key)

        # Determine processing strategy
        skip_expensive_processing = setup_analysis_mode(
            analysis_mode, clauses, rule_based_score, have_key
        )

        # Perform clause analysis
        clause_evidence, clause_violations, clause_fulfills = perform_clause_analysis(
            skip_expensive_processing, analysis_mode, clauses, have_key, s
        )

        # Merge clause analysis with rule-based analysis
        all_evidence.extend(clause_evidence)
        for art, count in clause_violations.items():
            article_violations[art] = article_violations.get(art, 0) + count
        for art, count in clause_fulfills.items():
            article_fulfills[art] = article_fulfills.get(art, 0) + count

        # Prepare analysis data
        analysis_data = {
            "article_violations": article_violations,
            "article_fulfills": article_fulfills,
            "article_severity_map": article_severity_map,
            "all_evidence": all_evidence,
        }

        # Build final results
        return build_final_results(
            analysis_data,
            analysis_mode,
            have_key,
            clauses,
            skip_expensive_processing,
        )
    except Exception as e:
        raise VerificationError(f"Policy verification failed: {e}") from e
