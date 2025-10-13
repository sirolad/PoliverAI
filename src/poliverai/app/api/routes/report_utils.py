"""Report utilities for formatting and content generation.

This module contains utility functions for formatting various sections
of compliance reports and generating content.
"""

from __future__ import annotations

from typing import Any

# Constants for formatting
MAX_EXCERPT_LENGTH = 150
MAX_EVIDENCE_EXCERPT_LENGTH = 200
MAX_ARTICLE_DISPLAY_LENGTH = 100
MAX_RECOMMENDATIONS_IN_REVISION = 5


def format_report_header(
    document_name: str,
    timestamp: str,
    analysis_data: dict[str, Any],
) -> str:
    """Format the report header with executive summary."""
    analysis_mode = analysis_data["analysis_mode"]
    verdict = analysis_data["verdict"]
    score = analysis_data["score"]
    confidence = analysis_data["confidence"]
    findings = analysis_data["findings"]
    metrics = analysis_data["metrics"]

    # Categorize findings by severity for metrics
    high_severity = [f for f in findings if f.get("severity") == "high"]
    medium_severity = [f for f in findings if f.get("severity") == "medium"]
    low_severity = [f for f in findings if f.get("severity") == "low"]

    verdict_emoji = {"compliant": "✅", "partially_compliant": "⚠️", "non_compliant": "❌"}.get(
        verdict, "❓"
    )

    return f"""
# GDPR Compliance Verification Report

**Document:** {document_name}
**Generated:** {timestamp}
**Analysis Mode:** {analysis_mode.title()}

---

## Executive Summary

**Compliance Verdict:** {verdict_emoji} {verdict.replace("_", " ").title()}
**Overall Score:** {score}/100
**Analysis Confidence:** {confidence:.1%}

### Key Metrics
- Total Issues Identified: {len(findings)}
- Critical Issues: {len(high_severity)}
- Moderate Issues: {len(medium_severity)}
- Minor Issues: {len(low_severity)}
- Requirements Met: {metrics.get("total_fulfills", 0)}
- Critical Areas: {metrics.get("critical_violations", 0)}

---

"""


def format_strengths_section(evidence: list[dict[str, Any]]) -> str:
    """Format the document strengths section."""
    content = "## Document Strengths\n"

    # Identify strengths (evidence that fulfills requirements)
    strengths = [e for e in evidence if e.get("verdict") == "fulfills"]

    if strengths:
        content += "\n**Compliant Provisions:**\n"
        for i, strength in enumerate(strengths[:5], 1):
            article = strength.get("article", "Unknown")[:MAX_ARTICLE_DISPLAY_LENGTH]
            excerpt = strength.get("policy_excerpt", "")[:MAX_EXCERPT_LENGTH]
            policy_excerpt = strength.get("policy_excerpt", "")
            truncate_marker = "..." if len(policy_excerpt) > MAX_EXCERPT_LENGTH else ""
            content += f"{i}. **{article}**: {excerpt}{truncate_marker}\n\n"
    else:
        content += (
            "\nLimited compliant provisions identified. Consider reviewing policy structure.\n"
        )

    return content


def format_findings_section(findings: list[dict[str, Any]], detailed: bool = False) -> str:
    """Format the findings section with compliance issues."""
    content = "\n---\n\n## Compliance Issues\n"

    # Categorize findings by severity
    high_severity = [f for f in findings if f.get("severity") == "high"]
    medium_severity = [f for f in findings if f.get("severity") == "medium"]
    low_severity = [f for f in findings if f.get("severity") == "low"]

    if detailed:
        # Group findings by severity for detailed view
        findings_by_severity = {
            "high": high_severity,
            "medium": medium_severity,
            "low": low_severity,
        }

        for severity, severity_findings in findings_by_severity.items():
            if not severity_findings:
                continue

            severity_emoji = {"high": "🔴", "medium": "🟡", "low": "🟢"}
            severity_label = {"high": "Critical", "medium": "Moderate", "low": "Minor"}

            severity_header = (
                f"### {severity_emoji[severity]} {severity_label[severity]} Severity Issues\n\n"
            )
            content += severity_header

            for i, finding in enumerate(severity_findings, 1):
                article = finding.get("article", "Unknown")
                issue = finding.get("issue", "No description")
                confidence = finding.get("confidence", 0.0)

                content += f"**{i}. {article}**\n"
                content += f"- **Issue:** {issue}\n"
                content += f"- **Confidence:** {confidence:.1%}\n"
                content += f"- **Severity:** {severity_label[severity]}\n\n"
    else:
        # Standard format for findings
        if high_severity:
            content += "\n### 🔴 Critical Issues (Immediate Action Required)\n\n"
            for i, finding in enumerate(high_severity, 1):
                article = finding.get("article", "Unknown")
                issue = finding.get("issue", "No description")
                confidence = finding.get("confidence", 0.0)
                issue_text = (
                    f"{i}. **{article}**\n   - Issue: {issue}\n"
                    f"   - Confidence: {confidence:.1%}\n\n"
                )
                content += issue_text

        if medium_severity:
            content += "\n### 🟡 Moderate Issues (Should Address Soon)\n\n"
            for i, finding in enumerate(medium_severity, 1):
                article = finding.get("article", "Unknown")
                issue = finding.get("issue", "No description")
                confidence = finding.get("confidence", 0.0)
                issue_text = (
                    f"{i}. **{article}**\n   - Issue: {issue}\n"
                    f"   - Confidence: {confidence:.1%}\n\n"
                )
                content += issue_text

        if low_severity:
            content += "\n### 🟢 Minor Issues (Low Priority)\n\n"
            for i, finding in enumerate(low_severity, 1):
                article = finding.get("article", "Unknown")
                issue = finding.get("issue", "No description")
                content += f"{i}. **{article}**: {issue}\n\n"

        if not findings:
            content += "\n✅ No compliance issues detected.\n"

    return content


def format_evidence_section(evidence: list[dict[str, Any]]) -> str:
    """Format the supporting evidence section."""
    content = "\n---\n\n## Supporting Evidence\n\n"

    if evidence:
        content += (
            "This section shows the specific policy excerpts that were analyzed "
            "and their compliance status.\n\n"
        )

        # Separate evidence by verdict
        violations = [e for e in evidence if e.get("verdict") == "violates"]
        fulfills = [e for e in evidence if e.get("verdict") == "fulfills"]
        unclear = [e for e in evidence if e.get("verdict") == "unclear"]

        if violations:
            content += "### ❌ Policy Violations\n\n"
            for i, evidence_item in enumerate(violations, 1):
                article = evidence_item.get("article", "Unknown")
                excerpt = evidence_item.get("policy_excerpt", "")[:MAX_EVIDENCE_EXCERPT_LENGTH]
                score = evidence_item.get("score", 0.0)
                rationale = evidence_item.get("rationale", "No rationale provided")
                policy_excerpt = evidence_item.get("policy_excerpt", "")
                truncate_marker = "..." if len(policy_excerpt) > MAX_EVIDENCE_EXCERPT_LENGTH else ""

                content += f"**{i}. {article}** (Score: {score:.2f})\n"
                content += f'- **Policy Excerpt:** "{excerpt}{truncate_marker}"\n'
                content += f"- **Analysis:** {rationale}\n\n"

        if fulfills:
            content += "### ✅ Compliant Provisions\n\n"
            for i, evidence_item in enumerate(fulfills, 1):
                article = evidence_item.get("article", "Unknown")
                excerpt = evidence_item.get("policy_excerpt", "")[:MAX_EVIDENCE_EXCERPT_LENGTH]
                score = evidence_item.get("score", 0.0)
                rationale = evidence_item.get("rationale", "No rationale provided")
                policy_excerpt = evidence_item.get("policy_excerpt", "")
                truncate_marker = "..." if len(policy_excerpt) > MAX_EVIDENCE_EXCERPT_LENGTH else ""

                content += f"**{i}. {article}** (Score: {score:.2f})\n"
                content += f'- **Policy Excerpt:** "{excerpt}{truncate_marker}"\n'
                content += f"- **Analysis:** {rationale}\n\n"

        if unclear:
            content += "### ❓ Unclear Provisions\n\n"
            for i, evidence_item in enumerate(unclear, 1):
                article = evidence_item.get("article", "Unknown")
                excerpt = evidence_item.get("policy_excerpt", "")[:MAX_EVIDENCE_EXCERPT_LENGTH]
                score = evidence_item.get("score", 0.0)
                rationale = evidence_item.get("rationale", "No rationale provided")
                policy_excerpt = evidence_item.get("policy_excerpt", "")
                truncate_marker = "..." if len(policy_excerpt) > MAX_EVIDENCE_EXCERPT_LENGTH else ""

                content += f"**{i}. {article}** (Score: {score:.2f})\n"
                content += f'- **Policy Excerpt:** "{excerpt}{truncate_marker}"\n'
                content += f"- **Analysis:** {rationale}\n\n"
    else:
        content += "No supporting evidence available for this analysis.\n\n"

    return content


def format_methodology_section(analysis_mode: str, document_name: str, timestamp: str) -> str:
    """Format the methodology and analysis details section."""
    content = "\n---\n\n## Methodology & Analysis Details\n\n"

    if analysis_mode == "fast":
        content += (
            "**Analysis Mode:** Fast Mode\n\n"
            "This report was generated using rule-based GDPR compliance checks "
            "for rapid assessment. The analysis focuses on identifying obvious "
            "compliance gaps through pattern matching and keyword detection "
            "against known GDPR requirements.\n\n"
            "**Key Features:**\n"
            "- Lightning fast analysis (< 1 second)\n"
            "- Rule-based compliance pattern detection\n"
            "- Suitable for initial screening and bulk processing\n"
            "- May miss nuanced violations requiring contextual understanding\n\n"
            "**Recommendation:** For production compliance verification, "
            "consider using Balanced mode for more thorough analysis "
            "of sensitive clauses.\n"
        )
    elif analysis_mode == "balanced":
        content += (
            "**Analysis Mode:** Balanced Mode (Recommended)\n\n"
            "This report combines rule-based checks with selective AI analysis "
            "on sensitive clauses. The system identifies privacy-sensitive content "
            "and applies advanced language models for nuanced compliance evaluation.\n\n"
            "**Key Features:**\n"
            "- Smart AI analysis focused on sensitive clauses\n"
            "- Detects nuanced violations like automatic data collection\n"
            "- Optimal balance of accuracy and performance (~30-60 seconds)\n"
            "- Recommended for production compliance verification\n\n"
            "**Analysis Process:**\n"
            "1. Rule-based baseline assessment\n"
            "2. Identification of privacy-sensitive clauses\n"
            "3. AI-powered analysis of sensitive content\n"
            "4. Hybrid scoring combining rule-based and AI insights\n"
        )
    elif analysis_mode == "detailed":
        content += (
            "**Analysis Mode:** Detailed Mode\n\n"
            "This report provides the most comprehensive analysis using AI-powered evaluation "
            "of all substantial policy clauses. Every meaningful section is analyzed for "
            "GDPR compliance with maximum accuracy.\n\n"
            "**Key Features:**\n"
            "- Full AI analysis of all substantial clauses\n"
            "- Maximum accuracy and comprehensive coverage\n"
            "- Detailed contextual understanding\n"
            "- Suitable for legal review and research (~30-60 seconds)\n\n"
            "**Analysis Process:**\n"
            "1. Rule-based baseline assessment\n"
            "2. Comprehensive clause segmentation\n"
            "3. AI-powered analysis of all meaningful sections\n"
            "4. Detailed compliance scoring with confidence metrics\n"
        )

    content += "\n**Compliance Framework:** General Data Protection Regulation (EU) 2016/679\n"
    content += "**Analysis Engine:** PoliverAI GDPR Verification System\n"
    content += f"**Document Analyzed:** {document_name}\n"

    report_footer = (
        f"\n---\n\n*Report generated by PoliverAI using {analysis_mode} "
        f"analysis mode on {timestamp}*\n"
    )
    content += report_footer

    return content


def build_revision_instructions(
    findings: list[dict[str, Any]], recommendations: list[dict[str, Any]]
) -> str:
    """Build detailed revision instructions based on findings and recommendations."""
    critical_issues = [f for f in findings if f.get("severity") == "high"]
    moderate_issues = [f for f in findings if f.get("severity") == "medium"]

    revision_instructions = (
        "Please revise this privacy policy to address the following GDPR compliance issues:\n\n"
    )

    if critical_issues:
        revision_instructions += "CRITICAL ISSUES (must fix):\n"
        for i, issue in enumerate(critical_issues, 1):
            article = issue.get("article", "Unknown")
            problem = issue.get("issue", "No description")
            revision_instructions += f"{i}. {article}: {problem}\n"

    if moderate_issues:
        revision_instructions += "\nMODERATE ISSUES (should fix):\n"
        for i, issue in enumerate(moderate_issues, 1):
            article = issue.get("article", "Unknown")
            problem = issue.get("issue", "No description")
            revision_instructions += f"{i}. {article}: {problem}\n"

    # Add recommendations as guidance
    if recommendations:
        revision_instructions += "\nRECOMMENDED IMPROVEMENTS:\n"
        for i, rec in enumerate(recommendations[:MAX_RECOMMENDATIONS_IN_REVISION], 1):
            article = rec.get("article", "Unknown")
            suggestion = rec.get("suggestion", "No suggestion")
            revision_instructions += f"{i}. {article}: {suggestion}\n"

    revision_instructions += """

Revision Guidelines:
- Maintain the original structure and tone
- Only modify sections that need GDPR compliance fixes
- Add missing required information clearly
- Ensure legal language is precise
- Keep the policy readable for end users
- Add section headers if needed for clarity

Provide the complete revised policy document below:"""

    return revision_instructions
