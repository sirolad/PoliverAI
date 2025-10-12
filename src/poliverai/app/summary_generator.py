"""Comprehensive summary generator for GDPR policy analysis results.

This module provides detailed summary generation functionality that presents
analysis results in a comprehensive, user-friendly format similar to the
original detailed UI implementation.
"""

from __future__ import annotations

from typing import Any

# Constants for summary formatting
ARTICLE_LENGTH_LIMIT = 80
EXCERPT_LENGTH_LIMIT = 100
MAX_HIGH_SEVERITY_DISPLAY = 3
MAX_MEDIUM_SEVERITY_DISPLAY = 2
MAX_RECOMMENDATIONS_DISPLAY = 4
RECOMMENDATION_TITLE_LIMIT = 60


def _create_header_section(
    emoji: str, verdict_text: str, score_value: int, confidence: float
) -> str:
    """Create the header section of the summary."""
    return f"""## 📋 Comprehensive Analysis Summary

**Compliance Verdict:** {emoji} {verdict_text.replace("_", " ").title()}
**Overall Score:** {score_value}/100
**Analysis Confidence:** {confidence:.1%}

---

### 💪 Document Strengths
"""


def _add_strengths_section(strengths: list) -> str:
    """Add the document strengths section."""
    if strengths:
        content = "\n**✅ What's Working Well:**\n"
        for strength in strengths[:3]:  # Show top 3 strengths
            article = strength.get("article", "Unknown")
            excerpt = strength.get("policy_excerpt", "")[:EXCERPT_LENGTH_LIMIT]
            if len(article) > ARTICLE_LENGTH_LIMIT:
                article = article[:77] + "..."
            policy_excerpt = strength.get("policy_excerpt", "")
            truncate_marker = "..." if len(policy_excerpt) > EXCERPT_LENGTH_LIMIT else ""
            content += f"- **{article}**: {excerpt}{truncate_marker}\n"
        return content
    else:
        return (
            "\n❗ Limited compliant provisions identified. Consider reviewing policy structure.\n"
        )


def _add_issues_section(
    findings_data: list,
    high_severity_findings: list,
    medium_severity_findings: list,
    low_severity_findings: list,
) -> str:
    """Add the compliance issues section."""
    content = "\n### ⚠️ Compliance Gaps & Infractions\n"
    total_issues = len(findings_data)

    if total_issues == 0:
        return content + "\n🎉 **Excellent!** No significant compliance gaps detected.\n"

    critical_count = len(high_severity_findings)
    moderate_count = len(medium_severity_findings)
    minor_count = len(low_severity_findings)
    content += (
        f"\n**Total Issues Identified:** {total_issues} "
        f"({critical_count} critical, {moderate_count} moderate, "
        f"{minor_count} minor)\n\n"
    )

    # Add critical issues
    content += _format_severity_issues(
        high_severity_findings,
        "🔴 Critical Issues (Immediate Action Required)",
        MAX_HIGH_SEVERITY_DISPLAY,
        True,
    )

    # Add moderate issues
    content += _format_severity_issues(
        medium_severity_findings,
        "🟡 Moderate Issues (Should Address Soon)",
        MAX_MEDIUM_SEVERITY_DISPLAY,
        False,
    )

    return content


def _format_severity_issues(
    findings: list, title: str, max_display: int, show_detailed_note: bool
) -> str:
    """Format issues for a specific severity level."""
    if not findings:
        return ""

    content = f"**{title}:**\n"
    for finding in findings[:max_display]:
        article = finding.get("article", "Unknown")
        issue = finding.get("issue", "No description")
        if len(article) > ARTICLE_LENGTH_LIMIT:
            article = article[:77] + "..."
        content += f"- **{article}**: {issue}\n"

    if len(findings) > max_display:
        remaining_count = len(findings) - max_display
        if show_detailed_note:
            content += (
                f"- *...and {remaining_count} more critical issues (see detailed findings)*\n"
            )
        else:
            content += f"- *...and {remaining_count} more moderate issues*\n"
    content += "\n"
    return content


def _add_recommendations_section(recommendations_data: list) -> str:
    """Add the recommendations section."""
    content = "### 🎯 Key Recommendations\n"

    if not recommendations_data:
        return content + (
            "\n✅ No specific recommendations at this time. Continue monitoring compliance.\n"
        )

    content += "\n**Immediate Action Items:**\n"
    for i, rec in enumerate(recommendations_data[:MAX_RECOMMENDATIONS_DISPLAY], 1):
        article, suggestion = _extract_recommendation_parts(rec)
        if len(article) > RECOMMENDATION_TITLE_LIMIT:
            article = article[:57] + "..."
        content += f"{i}. **{article}**: {suggestion}\n"

    if len(recommendations_data) > MAX_RECOMMENDATIONS_DISPLAY:
        remaining_count = len(recommendations_data) - MAX_RECOMMENDATIONS_DISPLAY
        content += (
            f"\n*Plus {remaining_count} additional recommendations "
            "in the detailed section below.*\n"
        )
    return content


def _extract_recommendation_parts(rec) -> tuple[str, str]:
    """Extract article and suggestion from recommendation."""
    if isinstance(rec, dict):
        article = rec.get("article", "Unknown")
        if "suggestion" in rec:
            suggestion = rec.get("suggestion", "No suggestion provided")
        elif "description" in rec:
            suggestion = rec.get("description", "No description provided")
        else:
            suggestion = str(rec.get("title", "No recommendation provided"))
    else:
        article = "General"
        suggestion = str(rec)
    return article, suggestion


def _add_metrics_section(metrics_data: dict) -> str:
    """Add the analysis metrics section."""
    total_violations = metrics_data.get("total_violations", 0)
    total_fulfills = metrics_data.get("total_fulfills", 0)
    critical_violations = metrics_data.get("critical_violations", 0)

    if total_violations > 0 or total_fulfills > 0:
        content = "\n---\n\n### 📊 Analysis Metrics\n"
        content += f"- **Violations Detected:** {total_violations}\n"
        content += f"- **Requirements Met:** {total_fulfills}\n"
        content += f"- **Critical Areas:** {critical_violations}\n"
        return content
    return ""


def _add_mode_insights(selected_mode: str) -> str:
    """Add mode-specific insights."""
    content = "\n---\n\n### 🔍 Analysis Details\n"

    mode_insights = {
        "balanced": (
            "💡 **Balanced Mode**: AI analysis focused on sensitive clauses "
            "for nuanced privacy violations. Recommended for production use.\n"
        ),
        "detailed": (
            "💡 **Detailed Mode**: Comprehensive AI review of all substantial "
            "clauses. Maximum thoroughness for legal review.\n"
        ),
        "fast": (
            "💡 **Fast Mode**: Rule-based compliance checks for quick screening. "
            "Consider Balanced mode for deeper insights.\n"
        ),
    }

    return content + mode_insights.get(selected_mode, "")


def _add_next_steps(verdict_text: str) -> str:
    """Add next steps based on verdict."""
    next_steps = {
        "compliant": (
            "\n**Next Steps:** Continue regular compliance monitoring "
            "and updates as regulations evolve.\n"
        ),
        "partially_compliant": (
            "\n**Next Steps:** Address the identified gaps, prioritizing "
            "critical issues first. Consider legal review or user our Revised Policy Service.\n"
        ),
    }

    return next_steps.get(
        verdict_text,
        (
            "\n**Next Steps:** Immediate policy revision required. "
            "Use our Revised Policy Service for assistance.\n"
        ),
    )


def generate_comprehensive_summary(
    data: dict[str, Any],
    selected_mode: str,
    emoji: str,
    verdict_text: str,
    score_value: int,
) -> str:
    """Generate the comprehensive analysis summary content.

    This function creates a detailed summary that includes:
    - Executive summary with verdict and confidence
    - Document strengths and compliant provisions
    - Compliance gaps categorized by severity
    - Key recommendations with actionable items
    - Analysis metrics and mode-specific insights
    - Next steps based on compliance verdict

    Args:
        data: Analysis results dictionary containing findings, evidence, etc.
        selected_mode: Analysis mode used ('fast', 'balanced', 'detailed')
        emoji: Emoji representation of the verdict
        verdict_text: String verdict ('compliant', 'partially_compliant', 'non_compliant')
        score_value: Numeric compliance score (0-100)

    Returns:
        Formatted markdown string with comprehensive analysis summary
    """
    findings_data = data.get("findings", [])
    recommendations_data = data.get("recommendations", [])
    evidence_data = data.get("evidence", [])
    metrics_data = data.get("metrics", {})

    high_severity_findings = [f for f in findings_data if f.get("severity") == "high"]
    medium_severity_findings = [f for f in findings_data if f.get("severity") == "medium"]
    low_severity_findings = [f for f in findings_data if f.get("severity") == "low"]

    # Identify strengths from evidence (fulfills)
    strengths = [e for e in evidence_data if e.get("verdict") == "fulfills"][:5]

    # Build summary sections
    summary_content = _create_header_section(
        emoji, verdict_text, score_value, data.get("confidence", 0.0)
    )
    summary_content += _add_strengths_section(strengths)
    summary_content += _add_issues_section(
        findings_data, high_severity_findings, medium_severity_findings, low_severity_findings
    )
    summary_content += _add_recommendations_section(recommendations_data)
    summary_content += _add_metrics_section(metrics_data)
    summary_content += _add_mode_insights(selected_mode)
    summary_content += _add_next_steps(verdict_text)

    return summary_content


def get_verdict_emoji(verdict: str) -> str:
    """Get emoji representation for verdict.

    Args:
        verdict: Verdict string ('compliant', 'partially_compliant', 'non_compliant')

    Returns:
        Appropriate emoji string
    """
    verdict_emoji = {
        "compliant": "✅",
        "partially_compliant": "⚠️",
        "non_compliant": "❌",
    }
    return verdict_emoji.get(verdict, "❓")


def generate_success_status(
    verdict_text: str,
    score_value: int,
    selected_mode: str,
    metrics_data: dict[str, Any],
) -> str:
    """Generate success status message for analysis completion.

    Args:
        verdict_text: Verdict string
        score_value: Compliance score
        selected_mode: Analysis mode used
        metrics_data: Metrics dictionary

    Returns:
        Formatted success status message
    """
    emoji = get_verdict_emoji(verdict_text)

    return f"""**{emoji} Analysis Complete - {selected_mode.title()} Mode**

**Result:** {verdict_text.replace("_", " ").title()}
**Score:** {score_value}/100
**Total Violations:** {metrics_data.get("total_violations", 0)}
**Critical Violations:** {metrics_data.get("critical_violations", 0)}

Analysis completed successfully. Review the detailed findings below."""
