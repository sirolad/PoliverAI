from __future__ import annotations

import json
import logging
from typing import Any

from ..core.config import get_settings
from ..knowledge.gdpr_articles import get_article_with_title
from ..knowledge.mappings import map_requirement_to_articles
from ..preprocessing.segment import split_into_paragraphs
from .service import _init, retrieve

# Constants for verification
MIN_MEANINGFUL_WORDS = 5
MAX_CLAUSES_TO_PROCESS = 50
MIN_WORDS_FOR_LLM_PROCESSING = 20
HIGH_SEVERITY_THRESHOLD = 3
MEDIUM_SEVERITY_THRESHOLD = 2
CRITICAL_VIOLATIONS_MAJOR = 2
TOTAL_VIOLATIONS_THRESHOLD = 5
LARGE_DISTANCE_VALUE = 1e9

# Performance optimization constants
MAX_LLM_CLAUSES = 5  # Limit expensive LLM processing to most important clauses
LLM_TIMEOUT_SECONDS = 20  # Timeout for LLM calls
FAST_MODE_SCORE_THRESHOLD = 60  # Skip expensive processing if rule-based score is already good

# Additional constants
MAX_TITLE_LENGTH_FOR_DETECTION = 150
MAX_LINE_LENGTH = 100
EVIDENCE_COUNT_HIGH = 10
EVIDENCE_COUNT_MEDIUM = 5
EVIDENCE_COUNT_LOW = 2
DOCUMENT_LENGTH_SUBSTANTIAL = 500
DOCUMENT_LENGTH_MODERATE = 200
PARTIAL_COMPLIANT_SCORE_THRESHOLD = 40
MIN_VIOLATIONS_FOR_PARTIAL = 2
MIN_FULFILLS_FOR_PARTIAL = 2

# Compliance score thresholds
FULLY_COMPLIANT_THRESHOLD = 75
PARTIALLY_COMPLIANT_THRESHOLD = 35
MAX_VIOLATIONS_FOR_COMPLIANT = 1
MAX_VIOLATIONS_FOR_PARTIAL = 3
MAX_CRITICAL_FOR_PARTIAL = 2


def _llm_judge_clause(clause: str, context_items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    s = get_settings()
    init = _init()

    # Build compact context with article labels if available
    parts: list[str] = []
    for item in context_items[: s.top_k]:
        meta = item.get("meta", {}) or {}
        article = meta.get("article", "")
        src = meta.get("source", "")
        snippet = (item.get("doc") or "")[:800]
        label = f"[{article or 'Unknown'} | {src}]"
        parts.append(f"{label}\n{snippet}")
    context = "\n\n".join(parts) if parts else ""

    prompt = (
        "You are PoliverAI, a GDPR compliance assistant.\n"
        "Given a policy clause and contextual excerpts from GDPR, determine which "
        "GDPR articles the clause addresses, and whether it fulfills or violates them.\n"
        "Respond strictly in JSON with this schema: {\n"
        '  "judgments": [ {\n'
        "    \"article\": string,                # e.g., 'Article 5(1)(e)'\n"
        '    "verdict": "fulfills|violates|unclear",\n'
        '    "rationale": string,\n'
        '    "policy_excerpt": string,        # short quote from clause if applicable\n'
        '    "confidence": number              # 0-1\n'
        "  } ]\n"
        "}\n"
        "Only reference articles that are supported by the provided context."
    )

    messages = [
        {"role": "system", "content": prompt},
        {
            "role": "user",
            "content": (
                f"Policy clause:\n{clause}\n\n"
                f"Context (GDPR excerpts):\n{context}\n\n"
                "Return JSON now."
            ),
        },
    ]

    # Add timeout to OpenAI API call for better performance
    resp = init.client.chat.completions.create(
        model=s.openai_chat_model,
        messages=messages,
        temperature=0.0,  # Make completely deterministic
        seed=42,  # Ensure consistent results
        timeout=LLM_TIMEOUT_SECONDS,  # Add timeout for performance
    )
    content = (resp.choices[0].message.content or "").strip()
    try:
        data = json.loads(content)
        judg = data.get("judgments", [])
        if isinstance(judg, list):
            # Normalize
            out: list[dict[str, Any]] = []
            for j in judg:
                article = str(j.get("article", "")).strip()
                verdict = str(j.get("verdict", "unclear")).strip().lower()
                rationale = str(j.get("rationale", "")).strip()
                excerpt = str(j.get("policy_excerpt", "")).strip()
                try:
                    conf = float(j.get("confidence", 0.5))
                except Exception:
                    conf = 0.5
                if article:
                    out.append(
                        {
                            "article": article,
                            "verdict": verdict,
                            "rationale": rationale,
                            "policy_excerpt": excerpt,
                            "confidence": conf,
                        }
                    )
            return out
    except Exception as e:
        logging.warning(f"Failed to parse LLM judgment response: {e}")

    # Fallback if parsing fails
    return []


def _heuristic_judge_clause(
    clause: str, context_items: list[dict[str, Any]]
) -> list[dict[str, Any]]:
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


def _check_lawful_basis_violations(text_lower: str) -> list[dict[str, Any]]:
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


def _check_information_violations(text_lower: str) -> list[dict[str, Any]]:
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


def _check_erasure_violations(text_lower: str) -> list[dict[str, Any]]:
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


def _check_storage_violations(text_lower: str) -> list[dict[str, Any]]:
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


def _check_automatic_collection_violations(text_lower: str) -> list[dict[str, Any]]:
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


def _check_data_sharing_violations(text_lower: str) -> list[dict[str, Any]]:
    """Check for data sharing without proper lawful basis."""
    sharing_terms = ["share", "sharing", "disclose", "third party", "third-party"]
    if any(term in text_lower for term in sharing_terms):
        basis_terms = ["lawful basis", "consent", "legitimate interest", "legal obligation"]
        if not any(term in text_lower for term in basis_terms):
            return [
                {
                    "article": "Article 6(1)",
                    "reason": "Data sharing mentioned without clear lawful basis",
                    "severity": "high",
                }
            ]
    return []


def _check_compliance_fulfillments(text_lower: str) -> list[dict[str, Any]]:
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
            {"article": "Article 5(1)(e)", "reason": "Addresses data retention/deletion"}
        )

    if "erasure" in text_lower or "right to be forgotten" in text_lower:
        fulfills.append({"article": "Article 17", "reason": "Mentions right to erasure"})

    return fulfills


def _rule_based_compliance_check(text: str) -> dict[str, Any]:
    """Apply deterministic rule-based compliance checks for common GDPR requirements."""
    text_lower = text.lower()

    violations = []
    # Collect all violations using helper functions
    violations.extend(_check_lawful_basis_violations(text_lower))
    violations.extend(_check_information_violations(text_lower))
    violations.extend(_check_erasure_violations(text_lower))
    violations.extend(_check_storage_violations(text_lower))
    violations.extend(_check_automatic_collection_violations(text_lower))
    violations.extend(_check_data_sharing_violations(text_lower))

    # Collect all positive compliance indicators
    fulfills = _check_compliance_fulfillments(text_lower)

    return {"violations": violations, "fulfills": fulfills}


def _add_rule_based_evidence(
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


def _process_clauses(
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
                        judgments = _llm_judge_clause(clause, ctx)
                        llm_processed_count += 1
                    else:
                        judgments = _heuristic_judge_clause(clause, [])
                except Exception as e:
                    # Fallback to heuristic if LLM fails
                    logging.warning(f"LLM processing failed, using heuristic: {e}")
                    judgments = _heuristic_judge_clause(clause, [])
            else:
                judgments = _heuristic_judge_clause(clause, [])

        except Exception:
            judgments = _heuristic_judge_clause(clause, [])

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


def _get_compliance_summary(
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


def _generate_findings_and_recommendations(
    article_violations: dict[str, int],
    article_severity_map: dict[str, str] = None,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Generate findings and recommendations from violations.

    Args:
        article_violations: Count of violations per article
        article_severity_map: Optional mapping of articles to their rule-based severity levels
    """
    findings: list[dict[str, Any]] = []
    recommendations: list[dict[str, Any]] = []
    article_severity_map = article_severity_map or {}

    def _severity(count: int) -> str:
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

        # Simple recommendation per article
        article_with_title = get_article_with_title(art)
        if art.startswith("Article 5"):
            rec_text = "Add explicit retention time limits and document deletion schedules."
        elif art.startswith("Article 17"):
            rec_text = "Document user right to erasure and procedures to honor requests."
        elif art.startswith("Article 6"):
            rec_text = "State the lawful basis for each processing purpose."
        else:
            rec_text = (
                f"Review {article_with_title} requirements and align policy language accordingly."
            )
        recommendations.append({"article": article_with_title, "suggestion": rec_text})

    return findings, recommendations


# Sensitive keywords that indicate clauses requiring detailed LLM analysis in balanced mode
SENSITIVE_KEYWORDS = [
    "collect",
    "automatically",
    "automatic",
    "share",
    "sharing",
    "third-party",
    "third party",
    "retain",
    "retention",
    "store",
    "storage",
    "transfer",
    "process",
    "processing",
    "consent",
    "lawful basis",
    "legal basis",
    "children",
    "minor",
    "cookie",
    "tracking",
    "location",
    "biometric",
    "sensitive",
    "special category",
    "delete",
    "deletion",
    "erasure",
    "right to be forgotten",
    "profiling",
    "automated decision",
]


def _is_sensitive_clause(clause: str) -> bool:
    """Check if a clause contains sensitive keywords requiring detailed analysis."""
    clause_lower = clause.lower()
    return any(keyword in clause_lower for keyword in SENSITIVE_KEYWORDS)


def _should_skip_expensive_processing_balanced(
    clauses: list[str], rule_based_score: int, have_key: bool
) -> bool:
    """Determine if expensive processing should be skipped in balanced mode."""
    if not have_key:
        return True  # Can't do LLM processing without API key

    # Count sensitive clauses
    sensitive_clauses = [clause for clause in clauses if _is_sensitive_clause(clause)]

    # If we have sensitive clauses, don't skip expensive processing
    if sensitive_clauses:
        return False

    # If rule-based score is already very high, skip expensive processing
    if rule_based_score >= FAST_MODE_SCORE_THRESHOLD:
        return True

    # For balanced mode, if no sensitive content detected, use fast processing
    return True


def _process_clauses_balanced(
    clauses: list[str],
    have_key: bool,
    s,
    collections: dict[str, Any],
) -> None:
    """Process clauses with balanced approach - LLM only on sensitive content."""

    # Separate sensitive and non-sensitive clauses
    sensitive_clauses = [
        (i, clause) for i, clause in enumerate(clauses) if _is_sensitive_clause(clause)
    ]
    non_sensitive_clauses = [
        (i, clause) for i, clause in enumerate(clauses) if not _is_sensitive_clause(clause)
    ]

    # Sort sensitive clauses by length (longer clauses get priority for LLM processing)
    sensitive_clauses.sort(key=lambda x: -len(x[1].split()))

    llm_processed_count = 0
    max_llm_for_balanced = min(MAX_LLM_CLAUSES, len(sensitive_clauses))  # Limit LLM processing

    # Process sensitive clauses with LLM (up to limit)
    for _, clause in sensitive_clauses[:max_llm_for_balanced]:
        try:
            if have_key and len(clause.split()) > MIN_WORDS_FOR_LLM_PROCESSING:
                ctx = retrieve(clause, k=s.top_k)
                if ctx:
                    judgments = _llm_judge_clause(clause, ctx)
                    llm_processed_count += 1
                else:
                    judgments = _heuristic_judge_clause(clause, [])
            else:
                judgments = _heuristic_judge_clause(clause, [])
        except Exception as e:
            logging.warning(f"LLM processing failed for sensitive clause, using heuristic: {e}")
            judgments = _heuristic_judge_clause(clause, [])

        _add_judgments_to_collections(judgments, clause, collections)

    # Process remaining sensitive clauses with heuristics
    for _, clause in sensitive_clauses[max_llm_for_balanced:]:
        judgments = _heuristic_judge_clause(clause, [])
        _add_judgments_to_collections(judgments, clause, collections)

    # Process non-sensitive clauses with heuristics only
    for _, clause in non_sensitive_clauses[:20]:  # Limit total clauses processed
        judgments = _heuristic_judge_clause(clause, [])
        _add_judgments_to_collections(judgments, clause, collections)


def _add_judgments_to_collections(
    judgments: list[dict[str, Any]], clause: str, collections: dict[str, Any]
) -> None:
    """Add judgments to evidence collections."""
    all_evidence = collections["all_evidence"]
    article_violations = collections["article_violations"]
    article_fulfills = collections["article_fulfills"]

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


def _calculate_analysis_confidence(
    analysis_mode: str,
    have_key: bool,
    all_evidence: list[dict[str, Any]],
    clauses: list[str],
    skip_expensive_processing: bool,
) -> float:
    """Calculate confidence score based on analysis quality and completeness."""
    base_confidence = 0.5  # Start with 50% base confidence

    # Analysis mode factor (more thorough = higher confidence)
    if analysis_mode == "detailed":
        mode_factor = 0.25  # +25% for detailed analysis
    elif analysis_mode == "balanced":
        mode_factor = 0.15  # +15% for balanced analysis
    else:  # fast mode
        mode_factor = 0.05  # +5% for fast analysis

    # AI capability factor (OpenAI key availability)
    ai_factor = 0.20 if have_key else -0.10  # +20% with AI, -10% without

    # Evidence quality factor (more evidence = higher confidence)
    evidence_count = len(all_evidence)
    if evidence_count >= EVIDENCE_COUNT_HIGH:
        evidence_factor = 0.15
    elif evidence_count >= EVIDENCE_COUNT_MEDIUM:
        evidence_factor = 0.10
    elif evidence_count >= EVIDENCE_COUNT_LOW:
        evidence_factor = 0.05
    else:
        evidence_factor = -0.05  # Lower confidence with little evidence

    # Document length factor (longer documents analyzed = higher confidence)
    total_content = sum(len(clause.split()) for clause in clauses)
    if total_content >= DOCUMENT_LENGTH_SUBSTANTIAL:
        length_factor = 0.10  # Substantial document
    elif total_content >= DOCUMENT_LENGTH_MODERATE:
        length_factor = 0.05  # Moderate document
    else:
        length_factor = -0.05  # Short document, less to analyze

    # Processing depth factor (expensive processing = higher confidence)
    processing_factor = -0.05 if skip_expensive_processing else 0.10

    # Evidence verdict consistency (more definitive verdicts = higher confidence)
    definitive_evidence = len(
        [e for e in all_evidence if e.get("verdict") in ["fulfills", "violates"]]
    )

    if evidence_count > 0:
        clarity_ratio = definitive_evidence / evidence_count
        clarity_factor = (clarity_ratio - 0.5) * 0.10  # +/-5% based on clarity
    else:
        clarity_factor = 0

    # Calculate final confidence
    confidence = (
        base_confidence
        + mode_factor
        + ai_factor
        + evidence_factor
        + length_factor
        + processing_factor
        + clarity_factor
    )

    # Ensure confidence is within reasonable bounds (30% - 95%)
    confidence = max(0.30, min(0.95, confidence))

    return round(confidence, 2)


def _calculate_score_and_verdict(
    article_violations: dict[str, int], article_fulfills: dict[str, int]
) -> tuple[int, str]:
    """Calculate compliance score and verdict with partial compliance support."""
    total_violations = sum(article_violations.values())
    total_fulfills = sum(article_fulfills.values())

    # Critical articles that must be addressed
    critical_articles = ["Article 6(1)", "Article 13", "Article 5(1)(e)"]
    critical_violations = sum(1 for art in critical_articles if art in article_violations)

    # Enhanced base score calculation
    if critical_violations >= CRITICAL_VIOLATIONS_MAJOR:
        base_score = 25  # Major non-compliance
    elif critical_violations == 1:
        base_score = 45  # Moderate non-compliance - still allows for partial
    else:
        base_score = 70  # Good baseline

    # More nuanced penalty and bonus system
    violation_penalty = min(35, total_violations * 4)
    critical_penalty = critical_violations * 10
    fulfills_bonus = min(25, total_fulfills * 4)

    # Calculate final score with adjustments
    score = base_score - violation_penalty - critical_penalty + fulfills_bonus
    score = max(0, min(100, score))

    # Enhanced verdict determination with partial compliance
    # First check for full compliance
    if (
        score >= FULLY_COMPLIANT_THRESHOLD
        and total_violations <= MAX_VIOLATIONS_FOR_COMPLIANT
        and critical_violations == 0
    ):
        verdict = "compliant"
    # Then check for partial compliance (more lenient criteria)
    elif (
        score >= PARTIALLY_COMPLIANT_THRESHOLD
        and total_violations <= MAX_VIOLATIONS_FOR_PARTIAL
        and critical_violations <= MAX_CRITICAL_FOR_PARTIAL
        and total_fulfills > 0  # Must have some positive aspects
    ):
        verdict = "partially_compliant"
    # Check for borderline partial compliance with higher score but some issues
    elif (
        score >= PARTIAL_COMPLIANT_SCORE_THRESHOLD
        and total_violations <= MIN_VIOLATIONS_FOR_PARTIAL
        and critical_violations <= 1
        and total_fulfills >= MIN_FULFILLS_FOR_PARTIAL  # Must have several positive aspects
    ):
        verdict = "partially_compliant"
    else:
        verdict = "non_compliant"

    return score, verdict


def analyze_policy_streaming(text: str, analysis_mode: str = "fast", progress_callback=None):  # noqa: PLR0912, PLR0915
    """Streaming version of analyze_policy that yields progress updates.

    Args:
        text: Policy text to analyze
        analysis_mode: Analysis depth - 'fast', 'balanced', or 'detailed'
        progress_callback: Optional callback function for progress updates

    Yields:
        dict: Progress updates and final result
    """
    if progress_callback:
        progress_callback(5, "Initializing analysis...")

    s = get_settings()
    clauses = [c.text for c in split_into_paragraphs(text)]
    clauses = [c for c in clauses if len(c.split()) >= MIN_MEANINGFUL_WORDS][
        :MAX_CLAUSES_TO_PROCESS
    ]

    if progress_callback:
        progress_callback(15, f"Processing {len(clauses)} policy clauses...")

    # First apply rule-based checks for deterministic baseline
    rule_based = _rule_based_compliance_check(text)

    if progress_callback:
        progress_callback(30, "Completed rule-based compliance checks")

    all_evidence: list[dict[str, Any]] = []
    article_violations: dict[str, int] = {}
    article_fulfills: dict[str, int] = {}

    # Add rule-based evidence and preserve severity mapping
    article_severity_map = _add_rule_based_evidence(
        rule_based, all_evidence, article_violations, article_fulfills
    )

    # PERFORMANCE OPTIMIZATION: Check if rule-based analysis is already sufficient
    rule_based_score, _ = _calculate_score_and_verdict(article_violations, article_fulfills)

    if progress_callback:
        progress_callback(
            40, f"Rule-based analysis complete (preliminary score: {rule_based_score})"
        )

    # Process clauses with smart optimization
    have_key = bool(s.openai_api_key)
    collections = {
        "all_evidence": all_evidence,
        "article_violations": article_violations,
        "article_fulfills": article_fulfills,
    }

    # Analysis mode-based processing strategy
    if analysis_mode == "fast":
        skip_expensive_processing = True  # Pure heuristic processing
    elif analysis_mode == "detailed":
        skip_expensive_processing = False  # Full LLM processing on all substantial clauses
    elif analysis_mode == "balanced":
        # Intelligent selective processing based on content sensitivity
        skip_expensive_processing = _should_skip_expensive_processing_balanced(
            clauses, rule_based_score, have_key
        )
    else:
        # Default to fast mode for unknown modes
        skip_expensive_processing = True

    if not skip_expensive_processing:
        if progress_callback:
            progress_callback(50, f"Starting {analysis_mode} AI analysis...")

        if analysis_mode == "balanced":
            _process_clauses_balanced(clauses, have_key, s, collections)
        else:
            _process_clauses(clauses, have_key, s, collections)

        if progress_callback:
            progress_callback(75, f"Completed {analysis_mode} AI analysis")
    else:
        if progress_callback:
            progress_callback(60, "Using fast heuristic processing...")

        # Use fast heuristic-only processing
        for clause in clauses[:10]:  # Limit to top 10 clauses for speed
            judgments = _heuristic_judge_clause(clause, [])
            for j in judgments:
                art = j.get("article", "")
                verdict = j.get("verdict", "unclear")
                conf = float(j.get("confidence", 0.5))
                excerpt = j.get("policy_excerpt") or clause[:200]

                all_evidence.append(
                    {
                        "article": art,
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

    if progress_callback:
        progress_callback(85, "Generating findings and recommendations...")

    # Generate findings and recommendations with preserved severity
    findings, recommendations = _generate_findings_and_recommendations(
        article_violations, article_severity_map
    )

    # Calculate score and verdict
    score, verdict = _calculate_score_and_verdict(article_violations, article_fulfills)

    # Calculate additional metrics for analysis
    total_violations = sum(article_violations.values())
    total_fulfills = sum(article_fulfills.values())
    critical_articles = ["Article 6(1)", "Article 13", "Article 5(1)(e)"]
    critical_violations = sum(1 for art in critical_articles if art in article_violations)

    # Generate compliance summary
    compliance_summary = _get_compliance_summary(
        verdict, score, critical_violations, total_violations
    )

    # Collapse evidence to top 10 for brevity
    evidence_sorted = sorted(
        all_evidence,
        key=lambda e: (1 if e.get("verdict") == "fulfills" else 0, e.get("score", 0.0)),
        reverse=True,
    )
    top_evidence = [
        {k: v for k, v in e.items() if k in {"article", "policy_excerpt", "score"}}
        for e in evidence_sorted[:10]
    ]

    # Calculate dynamic confidence score based on analysis quality
    confidence = _calculate_analysis_confidence(
        analysis_mode, have_key, all_evidence, clauses, skip_expensive_processing
    )

    if progress_callback:
        progress_callback(100, "Analysis completed!")

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
                      - fast: heuristic-only processing (fastest)
                      - balanced: selective LLM processing on sensitive clauses (recommended)
                      - detailed: full LLM processing on all substantial clauses "
                      "(slowest but most thorough)
    """
    s = get_settings()
    clauses = [c.text for c in split_into_paragraphs(text)]
    clauses = [c for c in clauses if len(c.split()) >= MIN_MEANINGFUL_WORDS][
        :MAX_CLAUSES_TO_PROCESS
    ]

    # First apply rule-based checks for deterministic baseline
    rule_based = _rule_based_compliance_check(text)

    all_evidence: list[dict[str, Any]] = []
    article_violations: dict[str, int] = {}
    article_fulfills: dict[str, int] = {}

    # Add rule-based evidence and preserve severity mapping
    article_severity_map = _add_rule_based_evidence(
        rule_based, all_evidence, article_violations, article_fulfills
    )

    # PERFORMANCE OPTIMIZATION: Check if rule-based analysis is already sufficient
    rule_based_score, _ = _calculate_score_and_verdict(article_violations, article_fulfills)

    # Process clauses with smart optimization
    have_key = bool(s.openai_api_key)
    collections = {
        "all_evidence": all_evidence,
        "article_violations": article_violations,
        "article_fulfills": article_fulfills,
    }

    # Analysis mode-based processing strategy
    if analysis_mode == "fast":
        skip_expensive_processing = True  # Pure heuristic processing
    elif analysis_mode == "detailed":
        skip_expensive_processing = False  # Full LLM processing on all substantial clauses
    elif analysis_mode == "balanced":
        # Intelligent selective processing based on content sensitivity
        skip_expensive_processing = _should_skip_expensive_processing_balanced(
            clauses, rule_based_score, have_key
        )
    else:
        # Default to fast mode for unknown modes
        skip_expensive_processing = True

    if not skip_expensive_processing:
        if analysis_mode == "balanced":
            _process_clauses_balanced(clauses, have_key, s, collections)
        else:
            _process_clauses(clauses, have_key, s, collections)
    else:
        # Use fast heuristic-only processing
        for clause in clauses[:10]:  # Limit to top 10 clauses for speed
            judgments = _heuristic_judge_clause(clause, [])
            for j in judgments:
                art = j.get("article", "")
                verdict = j.get("verdict", "unclear")
                conf = float(j.get("confidence", 0.5))
                excerpt = j.get("policy_excerpt") or clause[:200]

                all_evidence.append(
                    {
                        "article": art,
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

    # Generate findings and recommendations with preserved severity
    findings, recommendations = _generate_findings_and_recommendations(
        article_violations, article_severity_map
    )

    # Calculate score and verdict
    score, verdict = _calculate_score_and_verdict(article_violations, article_fulfills)

    # Calculate additional metrics for analysis
    total_violations = sum(article_violations.values())
    total_fulfills = sum(article_fulfills.values())
    critical_articles = ["Article 6(1)", "Article 13", "Article 5(1)(e)"]
    critical_violations = sum(1 for art in critical_articles if art in article_violations)

    # Generate compliance summary
    compliance_summary = _get_compliance_summary(
        verdict, score, critical_violations, total_violations
    )

    # Collapse evidence to top 10 for brevity
    evidence_sorted = sorted(
        all_evidence,
        key=lambda e: (1 if e.get("verdict") == "fulfills" else 0, e.get("score", 0.0)),
        reverse=True,
    )
    top_evidence = [
        {k: v for k, v in e.items() if k in {"article", "policy_excerpt", "score"}}
        for e in evidence_sorted[:10]
    ]

    # Calculate dynamic confidence score based on analysis quality
    confidence = _calculate_analysis_confidence(
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
