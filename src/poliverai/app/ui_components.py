"""UI components for the Gradio interface.

This module contains reusable UI component definitions and utility functions
for building the Gradio interface.
"""

from __future__ import annotations

import os
from typing import Any

import gradio as gr

# Check for Gradio bypass authentication flag
GRADIO_BYPASS_AUTH = os.getenv("GRADIO_BYPASS_AUTH", "false").lower() == "true"

# Constants
ARTICLE_LENGTH_LIMIT = 80
EXCERPT_LENGTH_LIMIT = 100
MAX_HIGH_SEVERITY_DISPLAY = 3
MAX_MEDIUM_SEVERITY_DISPLAY = 2
MAX_RECOMMENDATIONS_DISPLAY = 4
RECOMMENDATION_TITLE_LIMIT = 60


def create_main_header() -> None:
    """Create the main header section for the UI."""
    gr.Markdown("# PoliverAI — GDPR Compliance Assistant")
    if GRADIO_BYPASS_AUTH:
        gr.Markdown("""
        **👋 Welcome to the Full-Feature Gradio Interface!**

        **🛠️ Developer Mode Enabled:** All analysis modes are available.
        This bypasses authentication restrictions for development and demo purposes.

        **Current Interface:** Full-Feature Gradio UI |
        **Production Interface:** [React Dashboard](/dashboard)
        """)
    else:
        gr.Markdown("""
        **👋 Welcome to the Gradio Interface!**
        This provides basic access to PoliverAI's features.

        **For full features including Pro subscription and advanced analysis modes,**
        visit our [React Frontend Dashboard](/dashboard) with account creation,
        authentication, and subscription management.

        **Current Interface:** Basic Gradio UI (Fast mode only) |
        **Full Interface:** [React Dashboard](/dashboard) (All features)
        """)


def create_analysis_mode_selector() -> gr.Radio:
    """Create the analysis mode selector component."""
    if GRADIO_BYPASS_AUTH:
        # Full access mode - all features available
        return gr.Radio(
            choices=[
                ("🚀 Fast - Quick basic checks (< 1s)", "fast"),
                ("⚖️ Balanced - Smart analysis (recommended, ~30-60s)", "balanced"),
                ("🔬 Detailed - Deep analysis (~30-60s)", "detailed"),
            ],
            label="Analysis Mode",
            value="balanced",
            info="Choose analysis depth vs. speed trade-off. All modes available.",
        )
    else:
        # Restricted mode - only fast mode available
        return gr.Radio(
            choices=[
                ("🚀 Fast - Quick basic checks (< 1s)", "fast"),
                ("⚖️ Balanced - Smart analysis (Pro required, ~30-60s)", "balanced"),
                ("🔬 Detailed - Deep analysis (Pro required, ~30-60s)", "detailed"),
            ],
            label="Analysis Mode",
            value="fast",
            info="Fast mode is free. Balanced/Detailed require Pro subscription.",
        )


def create_analysis_mode_guide() -> None:
    """Create the analysis mode guide accordion."""
    with gr.Accordion("Analysis Mode Guide", open=False):
        if GRADIO_BYPASS_AUTH:
            gr.Markdown("""
            **🚀 Fast Mode:**
            - Lightning fast analysis using rule-based checks
            - Detects common GDPR violations quickly
            - Best for: Initial screening, bulk processing

            **⚖️ Balanced Mode (Recommended):**
            - Smart AI analysis on sensitive clauses only
            - Detects nuanced violations like automatic data collection
            - Best for: Production verification, thorough compliance checks

            **🔬 Detailed Mode:**
            - Full AI analysis on all substantial clauses
            - Maximum accuracy and comprehensive analysis
            - Best for: Legal review, research, maximum thoroughness

            **📝 Developer Mode:** All analysis modes are available in this Gradio interface.
            """)
        else:
            gr.Markdown("""
            **🚀 Fast Mode (Free):**
            - Lightning fast analysis using rule-based checks
            - Detects common GDPR violations quickly
            - Available to all users without authentication
            - Best for: Initial screening, bulk processing

            **⚖️ Balanced Mode (Pro Required):**
            - Smart AI analysis on sensitive clauses only
            - Detects nuanced violations like automatic data collection
            - Requires Pro subscription and authentication
            - Best for: Production verification, thorough compliance checks

            **🔬 Detailed Mode (Pro Required):**
            - Full AI analysis on all substantial clauses
            - Maximum accuracy and comprehensive analysis
            - Requires Pro subscription and authentication
            - Best for: Legal review, research, maximum thoroughness

            **Note:** To use Balanced or Detailed modes, sign up for a Pro account
            and use the React frontend at `/dashboard` for full authentication support.
            """)


def create_file_upload_component() -> gr.File:
    """Create the file upload component."""
    return gr.File(label="Upload policy document to verify (.txt, .md, .pdf, .docx, .html)")


def create_verify_button() -> gr.Button:
    """Create the main verify button."""
    return gr.Button("Verify Compliance", variant="primary")


def create_progress_status() -> gr.Markdown:
    """Create the progress status component."""
    return gr.Markdown("Ready to analyze")


def create_results_components() -> (
    tuple[gr.Markdown, gr.Markdown, gr.Number, gr.Number, gr.JSON, gr.JSON, gr.JSON, gr.Markdown]
):
    """Create all the results display components."""
    with gr.Accordion("Summary & Key Violations", open=True):
        summary_display = gr.Markdown("Analysis results will appear here")

    with gr.Row():
        with gr.Column(scale=2):
            verdict = gr.Markdown("**Verdict:** Pending analysis")
        with gr.Column(scale=1):
            score = gr.Number(label="Compliance Score", precision=0)
        with gr.Column(scale=1):
            confidence = gr.Number(label="Confidence", precision=2)

    with gr.Accordion("Evidence", open=False):
        evidence = gr.JSON(label="Top Evidence")

    with gr.Accordion("Findings", open=False):
        findings = gr.JSON(label="Key Findings")

    with gr.Accordion("Recommendations", open=False):
        recommendations = gr.JSON(label="Actionable Recommendations")

    return summary_display, verdict, score, confidence, evidence, findings, recommendations


def create_export_components() -> tuple[gr.Button, gr.Markdown, gr.State]:
    """Create export-related components."""
    with gr.Row():
        with gr.Column():
            export_btn = gr.Button("📄 Export Full Report", variant="secondary", visible=False)
            export_status = gr.Markdown("", visible=False)

    # Hidden state to store analysis data for export
    analysis_data = gr.State(value=None)

    return export_btn, export_status, analysis_data


def create_revision_components() -> tuple[gr.Button, gr.Markdown]:
    """Create revision-related components."""
    with gr.Row():
        with gr.Column():
            revise_btn = gr.Button("🔄 Generate Revised Policy", variant="secondary", visible=False)
            revise_status = gr.Markdown("", visible=False)

    return revise_btn, revise_status


def format_evidence_display(evidence: list[dict[str, Any]]) -> str:
    """Format evidence data for display."""
    if not evidence:
        return "No evidence found."

    formatted = []
    for i, item in enumerate(evidence[:10], 1):
        article = item.get("article", "Unknown")
        if len(article) > ARTICLE_LENGTH_LIMIT:
            article = article[:ARTICLE_LENGTH_LIMIT] + "..."

        excerpt = item.get("policy_excerpt", "")
        if len(excerpt) > EXCERPT_LENGTH_LIMIT:
            excerpt = excerpt[:EXCERPT_LENGTH_LIMIT] + "..."

        score = item.get("score", 0)

        formatted.append(f"**{i}. {article}** (Score: {score})\n{excerpt}")

    return "\n\n".join(formatted)


def format_findings_display(findings: list[dict[str, Any]]) -> str:
    """Format findings data for display."""
    if not findings:
        return "No findings to report."

    high_severity = [f for f in findings if f.get("severity") == "high"]
    medium_severity = [f for f in findings if f.get("severity") == "medium"]

    formatted = []

    if high_severity:
        formatted.append("## 🔴 High Priority Issues")
        for item in high_severity[:MAX_HIGH_SEVERITY_DISPLAY]:
            article = item.get("article", "Unknown")
            issue = item.get("issue", "No description")
            formatted.append(f"- **{article}**: {issue}")

    if medium_severity:
        formatted.append("## 🟡 Medium Priority Issues")
        for item in medium_severity[:MAX_MEDIUM_SEVERITY_DISPLAY]:
            article = item.get("article", "Unknown")
            issue = item.get("issue", "No description")
            formatted.append(f"- **{article}**: {issue}")

    return "\n".join(formatted) if formatted else "No critical issues found."


def format_recommendations_display(recommendations: list[dict[str, Any]]) -> str:
    """Format recommendations data for display."""
    if not recommendations:
        return "No specific recommendations at this time."

    formatted = []
    for i, rec in enumerate(recommendations[:MAX_RECOMMENDATIONS_DISPLAY], 1):
        title = rec.get("title", "Recommendation")
        if len(title) > RECOMMENDATION_TITLE_LIMIT:
            title = title[:RECOMMENDATION_TITLE_LIMIT] + "..."

        description = rec.get("description", "No description")
        priority = rec.get("priority", "medium").upper()

        formatted.append(f"**{i}. {title}** [{priority}]\n{description}")

    return "\n\n".join(formatted)


def format_verdict_display(verdict: str, score: int, confidence: float) -> str:
    """Format the verdict display with styling."""
    if verdict == "compliant":
        emoji = "✅"
    elif verdict == "partially_compliant":
        emoji = "⚠️"
    else:
        emoji = "❌"

    formatted_verdict = verdict.replace("_", " ").title()

    return (
        f"**Verdict:** {emoji} {formatted_verdict} "
        f"(Score: {score}/100, Confidence: {confidence:.2f})"
    )
