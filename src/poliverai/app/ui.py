from __future__ import annotations

import json
import os
from typing import Any

import gradio as gr
import requests

# Check for Gradio bypass authentication flag
GRADIO_BYPASS_AUTH = os.getenv("GRADIO_BYPASS_AUTH", "false").lower() == "true"


# Constants
ARTICLE_LENGTH_LIMIT = 80
EXCERPT_LENGTH_LIMIT = 100
MAX_HIGH_SEVERITY_DISPLAY = 3
MAX_MEDIUM_SEVERITY_DISPLAY = 2
MAX_RECOMMENDATIONS_DISPLAY = 4
RECOMMENDATION_TITLE_LIMIT = 60

# Build absolute API base so requests has a scheme/host
# Defaults to localhost and the current PORT; can be overridden via env.
DEFAULT_HOST = os.getenv("POLIVERAI_UI_HOST", "127.0.0.1")
DEFAULT_PORT = os.getenv("PORT", "8000")
API_BASE = os.getenv("POLIVERAI_UI_API_BASE", f"http://{DEFAULT_HOST}:{DEFAULT_PORT}/api/v1")


def _post_json(path: str, payload: dict) -> dict:
    try:
        r = requests.post(path, json=payload, timeout=60)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        return {"error": str(e)}


def _post_files(path: str, files: list[tuple], data: dict = None) -> dict:
    try:
        r = requests.post(path, files=files, data=data, timeout=120)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        return {"error": str(e)}


def _post_files_streaming(
    path: str, files: list[tuple], data: dict = None, progress_callback=None
) -> dict:
    """Post files with streaming response support for progress updates."""
    try:
        with requests.post(path, files=files, data=data, stream=True, timeout=300) as r:
            r.raise_for_status()

            # Handle streaming response
            result = None
            for line in r.iter_lines():
                if line:
                    line_str = line.decode("utf-8")
                    if line_str.startswith("data: "):
                        try:
                            data_content = json.loads(line_str[6:])  # Remove 'data: ' prefix

                            # Call progress callback if provided
                            if progress_callback and "progress" in data_content:
                                progress_callback(
                                    data_content.get("progress", 0), data_content.get("message", "")
                                )

                            # Check if this is the final result
                            if (
                                data_content.get("status") == "completed"
                                and "result" in data_content
                            ):
                                result = data_content["result"]
                                break
                            elif data_content.get("status") == "error":
                                return {
                                    "error": data_content.get("message", "Unknown error occurred")
                                }

                        except json.JSONDecodeError:
                            continue  # Skip malformed JSON lines

            return result if result else {"error": "No result received from streaming endpoint"}

    except Exception as e:
        return {"error": str(e)}


def _create_ask_tab():
    """Create the Ask tab for the UI."""
    q = gr.Textbox(
        label="Question", placeholder="Ask a GDPR/compliance question...", submit_btn=True
    )
    ask_btn = gr.Button("Ask")
    ans = gr.Markdown(label="Answer")
    src = gr.JSON(label="Sources")

    def ask_fn(question: str):
        if not question.strip():
            return "Please enter a question.", []
        data = _post_json(f"{API_BASE}/query", {"question": question})
        if "error" in data:
            return f"Error: {data['error']}", []
        return data.get("answer", ""), data.get("sources", [])

    ask_btn.click(ask_fn, inputs=[q], outputs=[ans, src])
    q.submit(ask_fn, inputs=[q], outputs=[ans, src])
    return q, ask_btn, ans, src


def _create_verify_tab():  # noqa: PLR0915
    """Create the Verify tab for the UI."""
    with gr.Row():
        with gr.Column(scale=3):
            verify_file = gr.File(
                label="Upload policy document to verify (.txt, .md, .pdf, .docx, .html)"
            )
        with gr.Column(scale=1):
            if GRADIO_BYPASS_AUTH:
                # Full access mode - all features available
                analysis_mode = gr.Radio(
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
                analysis_mode = gr.Radio(
                    choices=[
                        ("🚀 Fast - Quick basic checks (< 1s)", "fast"),
                        ("⚖️ Balanced - Smart analysis (Pro required, ~30-60s)", "balanced"),
                        ("🔬 Detailed - Deep analysis (Pro required, ~30-60s)", "detailed"),
                    ],
                    label="Analysis Mode",
                    value="fast",
                    info="Fast mode is free. Balanced/Detailed require Pro subscription.",
                )

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

    verify_btn = gr.Button("Verify Compliance", variant="primary")

    # Progress and status indicators
    with gr.Row():
        analysis_status = gr.Markdown("Ready to analyze")

    # Progress tracking is handled internally by the streaming endpoint

    with gr.Accordion("Summary & Key Violations", open=True):
        summary_display = gr.Markdown("Analysis results will appear here")

    # Export Report Section
    with gr.Row():
        with gr.Column(scale=1):
            export_btn = gr.Button("📄 Export Report (PDF)", variant="secondary", visible=False)
            export_status = gr.Markdown("", visible=True)
        with gr.Column(scale=1):
            revise_btn = gr.Button("✨ Generate Revised Policy", variant="primary", visible=False)
            revise_status = gr.Markdown("", visible=True)

    with gr.Row():
        with gr.Column():
            verdict = gr.Textbox(label="Verdict", interactive=False)
            score = gr.Number(label="Compliance Score (0-100)", interactive=False)
            confidence = gr.Number(label="Confidence", interactive=False)
        with gr.Column():
            evidence = gr.JSON(label="Evidence")

    with gr.Row():
        with gr.Column():
            findings = gr.JSON(label="Detailed Findings")
        with gr.Column():
            recommendations = gr.JSON(label="Recommendations")

    def _get_no_file_result():
        """Return result tuple for no file selected case."""
        return (
            "⚠️ No file selected",
            "No file selected",
            0,
            0.0,
            [],
            [],
            [],
            "No file selected",
            gr.Button("📄 Export Report (PDF)", variant="secondary", visible=False),
            "",
            gr.Button("✨ Generate Revised Policy", variant="primary", visible=False),
            "",
        )

    def _get_error_result(error_message: str):
        """Return result tuple for error cases."""
        error_status = f"❌ **Analysis Failed**\n\nError: {error_message}"
        return (
            error_status,
            f"Error: {error_message}",
            0,
            0.0,
            [],
            [],
            [],
            "Analysis failed",
            gr.Button("📄 Export Report (PDF)", variant="secondary", visible=False),
            "",
            gr.Button("✨ Generate Revised Policy", variant="primary", visible=False),
            "",
        )

    def _generate_summary_content(  # noqa: PLR0912, PLR0915
        data: dict, selected_mode: str, emoji: str, verdict_text: str, score_value: int
    ):
        """Generate the comprehensive analysis summary content."""
        findings_data = data.get("findings", [])
        recommendations_data = data.get("recommendations", [])
        evidence_data = data.get("evidence", [])
        metrics_data = data.get("metrics", {})

        high_severity_findings = [f for f in findings_data if f.get("severity") == "high"]
        medium_severity_findings = [f for f in findings_data if f.get("severity") == "medium"]
        low_severity_findings = [f for f in findings_data if f.get("severity") == "low"]

        # Identify strengths from evidence (fulfills)
        strengths = [e for e in evidence_data if e.get("verdict") == "fulfills"][:5]

        summary_content = f"""## 📋 Comprehensive Analysis Summary

**Compliance Verdict:** {emoji} {verdict_text.replace("_", " ").title()}
**Overall Score:** {score_value}/100
**Analysis Confidence:** {data.get("confidence", 0.0):.1%}

---

### 💪 Document Strengths
"""

        # Add strengths section
        if strengths:
            summary_content += "\n**✅ What's Working Well:**\n"
            for strength in strengths[:3]:  # Show top 3 strengths
                article = strength.get("article", "Unknown")
                excerpt = strength.get("policy_excerpt", "")[:EXCERPT_LENGTH_LIMIT]
                if len(article) > ARTICLE_LENGTH_LIMIT:
                    article = article[:77] + "..."
                policy_excerpt = strength.get("policy_excerpt", "")
                truncate_marker = "..." if len(policy_excerpt) > EXCERPT_LENGTH_LIMIT else ""
                summary_content += f"- **{article}**: {excerpt}{truncate_marker}\n"
        else:
            summary_content += (
                "\n❗ Limited compliant provisions identified. "
                "Consider reviewing policy structure.\n"
            )

        # Add issues section
        summary_content += "\n### ⚠️ Compliance Gaps & Infractions\n"
        total_issues = len(findings_data)

        if total_issues == 0:
            summary_content += "\n🎉 **Excellent!** No significant compliance gaps detected.\n"
        else:
            critical_count = len(high_severity_findings)
            moderate_count = len(medium_severity_findings)
            minor_count = len(low_severity_findings)
            summary_content += (
                f"\n**Total Issues Identified:** {total_issues} "
                f"({critical_count} critical, {moderate_count} moderate, "
                f"{minor_count} minor)\n\n"
            )

        # Add critical issues
        if high_severity_findings:
            summary_content += "**🔴 Critical Issues (Immediate Action Required):**\n"
            for finding in high_severity_findings[:MAX_HIGH_SEVERITY_DISPLAY]:
                article = finding.get("article", "Unknown")
                issue = finding.get("issue", "No description")
                if len(article) > ARTICLE_LENGTH_LIMIT:
                    article = article[:77] + "..."
                summary_content += f"- **{article}**: {issue}\n"
            if len(high_severity_findings) > MAX_HIGH_SEVERITY_DISPLAY:
                remaining_count = len(high_severity_findings) - MAX_HIGH_SEVERITY_DISPLAY
                summary_content += (
                    f"- *...and {remaining_count} more critical issues (see detailed findings)*\n"
                )
            summary_content += "\n"

        # Add moderate issues
        if medium_severity_findings:
            summary_content += "**🟡 Moderate Issues (Should Address Soon):**\n"
            for finding in medium_severity_findings[:MAX_MEDIUM_SEVERITY_DISPLAY]:
                article = finding.get("article", "Unknown")
                issue = finding.get("issue", "No description")
                if len(article) > ARTICLE_LENGTH_LIMIT:
                    article = article[:77] + "..."
                summary_content += f"- **{article}**: {issue}\n"
            if len(medium_severity_findings) > MAX_MEDIUM_SEVERITY_DISPLAY:
                remaining_count = len(medium_severity_findings) - MAX_MEDIUM_SEVERITY_DISPLAY
                summary_content += f"- *...and {remaining_count} more moderate issues*\n"
            summary_content += "\n"

        # Add recommendations section
        summary_content += "### 🎯 Key Recommendations\n"

        if recommendations_data:
            summary_content += "\n**Immediate Action Items:**\n"
            for i, rec in enumerate(recommendations_data[:MAX_RECOMMENDATIONS_DISPLAY], 1):
                article = rec.get("article", "Unknown")
                suggestion = rec.get("suggestion", "No suggestion provided")
                if len(article) > RECOMMENDATION_TITLE_LIMIT:
                    article = article[:57] + "..."
                summary_content += f"{i}. **{article}**: {suggestion}\n"

            if len(recommendations_data) > MAX_RECOMMENDATIONS_DISPLAY:
                remaining_count = len(recommendations_data) - MAX_RECOMMENDATIONS_DISPLAY
                summary_content += (
                    f"\n*Plus {remaining_count} additional recommendations "
                    "in the detailed section below.*\n"
                )
        else:
            summary_content += (
                "\n✅ No specific recommendations at this time. Continue monitoring compliance.\n"
            )

        # Add metrics and analysis details
        total_violations = metrics_data.get("total_violations", 0)
        total_fulfills = metrics_data.get("total_fulfills", 0)
        critical_violations = metrics_data.get("critical_violations", 0)

        if total_violations > 0 or total_fulfills > 0:
            summary_content += "\n---\n\n### 📊 Analysis Metrics\n"
            summary_content += f"- **Violations Detected:** {total_violations}\n"
            summary_content += f"- **Requirements Met:** {total_fulfills}\n"
            summary_content += f"- **Critical Areas:** {critical_violations}\n"

        # Add mode-specific insights and next steps
        summary_content += "\n---\n\n### 🔍 Analysis Details\n"
        if selected_mode == "balanced":
            summary_content += (
                "💡 **Balanced Mode**: AI analysis focused on sensitive clauses "
                "for nuanced privacy violations. Recommended for production use.\n"
            )
        elif selected_mode == "detailed":
            summary_content += (
                "💡 **Detailed Mode**: Comprehensive AI review of all substantial "
                "clauses. Maximum thoroughness for legal review.\n"
            )
        elif selected_mode == "fast":
            summary_content += (
                "💡 **Fast Mode**: Rule-based compliance checks for quick screening. "
                "Consider Balanced mode for deeper insights.\n"
            )

        # Add next steps based on verdict
        if verdict_text == "compliant":
            summary_content += (
                "\n**Next Steps:** Continue regular compliance monitoring "
                "and updates as regulations evolve.\n"
            )
        elif verdict_text == "partially_compliant":
            summary_content += (
                "\n**Next Steps:** Address the identified gaps, prioritizing "
                "critical issues first. Consider legal review.\n"
            )
        else:
            summary_content += (
                "\n**Next Steps:** Immediate policy revision required. "
                "Consider consulting GDPR legal expert.\n"
            )

        return summary_content

    def verify_fn(uploaded_file: Any, selected_mode: str):
        if not uploaded_file:
            return _get_no_file_result()

        # Update status based on selected mode
        mode_info = {
            "fast": (
                "🚀 Running Fast Analysis (< 1s)",
                "Performing rule-based GDPR compliance checks...",
            ),
            "balanced": (
                "⚖️ Running Balanced Analysis (~30-60s)",
                "Analyzing sensitive clauses with AI for thorough verification...",
            ),
            "detailed": (
                "🔬 Running Detailed Analysis (~30-60s)",
                "Performing comprehensive AI analysis on all clauses...",
            ),
        }

        status_title, status_desc = mode_info.get(selected_mode, ("Running analysis...", ""))
        _initial_status = (
            f"**{status_title}**\n\n{status_desc}\n\n"
            "Please wait while we analyze your privacy policy..."
        )

        try:
            # Read the file content first
            with open(uploaded_file.name, "rb") as f:
                file_content = f.read()

            # Prepare the files for the request
            files = [
                (
                    "file",
                    (
                        os.path.basename(uploaded_file.name),
                        file_content,
                        "application/octet-stream",
                    ),
                )
            ]

            # Include analysis mode in the request
            form_data = {"analysis_mode": selected_mode}

            # Create a progress callback for Gradio
            def update_progress(progress_val, message):
                # Update the analysis status with progress
                progress_status = (
                    f"**{status_title}** ({progress_val}%)\n\n{message}\n\nPlease wait..."
                )
                return progress_status

            # Try streaming endpoint first for better user experience
            data = _post_files_streaming(
                f"{API_BASE}/verify-stream", files, form_data, progress_callback=update_progress
            )

            # Fallback to regular endpoint if streaming fails
            if "error" in data and (
                "not found" in data["error"].lower()
                or "method not allowed" in data["error"].lower()
            ):
                data = _post_files(f"{API_BASE}/verify", files, form_data)

            if "error" in data:
                error_msg = data["error"]
                # Check if it's a Pro subscription error
                if "Pro subscription" in error_msg or "Advanced analysis modes" in error_msg:
                    enhanced_error = (
                        f"{error_msg}\n\n"
                        "💡 **Solution:** Use Fast mode (free) or upgrade to Pro:\n\n"
                        "1. Select 'Fast' analysis mode above, or\n"
                        "2. Visit `/dashboard` to sign up for Pro and access advanced features\n\n"
                        "Fast mode still provides comprehensive GDPR compliance checking!"
                    )
                    return _get_error_result(enhanced_error)
                return _get_error_result(error_msg)

            # Success status with mode-specific messaging
            verdict_emoji = {"compliant": "✅", "partially_compliant": "⚠️", "non_compliant": "❌"}

            verdict_text = data.get("verdict", "unknown")
            emoji = verdict_emoji.get(verdict_text, "❓")
            score_value = data.get("score", 0)

            success_status = f"""**{emoji} Analysis Complete - {selected_mode.title()} Mode**

**Result:** {verdict_text.replace("_", " ").title()}
**Score:** {score_value}/100
**Total Violations:** {data.get("metrics", {}).get("total_violations", 0)}
**Critical Violations:** {data.get("metrics", {}).get("critical_violations", 0)}

Analysis completed successfully. Review the detailed findings below."""

            # Generate summary content using helper function
            summary_content = _generate_summary_content(
                data, selected_mode, emoji, verdict_text, score_value
            )

            return (
                success_status,
                data.get("verdict", "unknown").title(),
                data.get("score", 0),
                data.get("confidence", 0.0),
                data.get("evidence", []),
                data.get("findings", []),
                data.get("recommendations", []),
                summary_content,
                gr.Button(
                    "📄 Export Report (PDF)", variant="secondary", visible=True
                ),  # Show export button
                "",  # Clear export status
                gr.Button(
                    "✨ Generate Revised Policy", variant="primary", visible=True
                ),  # Show revision button
                "",  # Clear revision status
            )
        except Exception as e:
            return _get_error_result(f"Unexpected error: {str(e)}")

    # Store the analysis data for export
    analysis_data = gr.State()

    def export_report_fn(current_data: dict):
        if not current_data:
            return (
                "❌ **Export Failed**\n\nNo analysis data available. Please run verification first."
            )

        try:
            # Prepare the verification report request
            payload = {
                "verdict": current_data.get("verdict", "unknown"),
                "score": current_data.get("score", 0),
                "confidence": current_data.get("confidence", 0.0),
                "findings": current_data.get("findings", []),
                "recommendations": current_data.get("recommendations", []),
                "evidence": current_data.get("evidence", []),
                "metrics": current_data.get("metrics", {}),
                "analysis_mode": current_data.get("analysis_mode", "balanced"),
                "document_name": current_data.get("document_name", "Policy Document"),
            }

            # Generate the report
            response = _post_json(f"{API_BASE}/verification-report", payload)

            if "error" in response:
                error_msg = (
                    f"❌ **Export Failed**\n\nError: {response['error']}\n\n"
                    "Please try again or contact support."
                )
                return error_msg

            download_url = response.get("download_url", "")
            filename = response.get("filename", "report.pdf")
            full_download_url = f"http://127.0.0.1:8000{download_url}"

            success_msg = (
                f"✅ **Report Generated Successfully!**\n\n**File:** `{filename}`\n\n"
                f"**Download Link:** [Click here to download your report]({full_download_url})\n\n"
                "*The report contains your complete compliance analysis. "
                "Right-click the link and select 'Save As' to save the PDF.*"
            )
            return success_msg

        except Exception as e:
            error_msg = (
                f"❌ **Export Failed**\n\nUnexpected error: {str(e)}\n\n"
                "Please try again. If the problem persists, check that the "
                "server is running properly."
            )
            return error_msg

    def generate_revision_fn(current_data: dict):
        if not current_data:
            return (
                "❌ **Revision Failed**\n\n"
                "No analysis data available. Please run verification first."
            )

        # Check if there are any issues to fix
        findings = current_data.get("findings", [])
        if not findings:
            return (
                "✅ **No Revision Needed**\n\n"
                "Your policy appears to be fully compliant! "
                "No issues were found that require revision."
            )

        try:
            # Prepare the revision request
            payload = {
                "original_document": current_data.get("original_document", ""),
                "findings": findings,
                "recommendations": current_data.get("recommendations", []),
                "evidence": current_data.get("evidence", []),
                "document_name": current_data.get("document_name", "Policy Document"),
                "revision_mode": "comprehensive",
            }

            # Check if we have the original document
            if not payload["original_document"]:
                return (
                    "❌ **Revision Failed**\n\n"
                    "Original document content not available. "
                    "Please re-upload and verify your document first."
                )

            # Generate the revised policy
            response = _post_json(f"{API_BASE}/generate-revision", payload)

            if "error" in response:
                error_msg = (
                    f"❌ **Revision Failed**\n\nError: {response['error']}\n\n"
                    "Please try again or contact support."
                )
                return error_msg

            download_url = response.get("download_url", "")
            filename = response.get("filename", "revised-policy.txt")
            full_download_url = f"http://127.0.0.1:8000{download_url}"

            issues_fixed = len([f for f in findings if f.get("severity") in ["high", "medium"]])
            total_issues = len(findings)

            success_msg = (
                f"✨ **Revised Policy Generated Successfully!**\n\n"
                f"**File:** `{filename}`\n"
                f"**Issues Addressed:** {issues_fixed} critical/moderate out of "
                f"{total_issues} total\n\n"
                f"**Download Link:** [Click here to download your revised policy]"
                f"({full_download_url})\n\n"
                "*The revised policy addresses the compliance issues found during verification. "
                "Review the changes and customize as needed for your organization.*"
            )
            return success_msg

        except Exception as e:
            error_msg = (
                f"❌ **Revision Failed**\n\nUnexpected error: {str(e)}\n\n"
                "Please try again. If the problem persists, check that the "
                "server is running properly."
            )
            return error_msg

    def verify_fn_wrapper(uploaded_file: Any, selected_mode: str):
        # Get the original verification results
        result = verify_fn(uploaded_file, selected_mode)

        # If successful and not an error, extract analysis data from the result
        minimum_result_length = 8
        if (
            uploaded_file
            and len(result) >= minimum_result_length
            and result[1] != "No file selected"
            and not result[0].startswith("❌")
        ):
            try:
                # Read the file content for export (only if needed for revision)
                with open(uploaded_file.name, "rb") as f:
                    file_content = f.read()

                # Create analysis data dict from the result for export
                # The verify_fn already contains all the data we need
                analysis_data_dict = {
                    "verdict": result[1].lower().replace(" ", "_"),
                    "score": result[2],
                    "confidence": result[3],
                    "evidence": result[4],
                    "findings": result[5],
                    "recommendations": result[6],
                    "analysis_mode": selected_mode,
                    "document_name": os.path.basename(uploaded_file.name),
                    "original_document": file_content.decode("utf-8", errors="ignore"),
                    "metrics": {
                        "total_violations": len(result[5]),
                        "total_fulfills": len(
                            [e for e in result[4] if "fulfills" in str(e).lower()]
                        ),
                        "critical_violations": len(
                            [f for f in result[5] if f.get("severity") == "high"]
                        ),
                    },
                }
                return result + (analysis_data_dict,)
            except Exception as e:
                # Log the error but don't prevent verification from completing
                print(f"Warning: Failed to store analysis data for export: {e}")

        return result + (None,)

    verify_btn.click(
        verify_fn_wrapper,
        inputs=[verify_file, analysis_mode],
        outputs=[
            analysis_status,
            verdict,
            score,
            confidence,
            evidence,
            findings,
            recommendations,
            summary_display,
            export_btn,
            export_status,
            revise_btn,
            revise_status,
            analysis_data,
        ],
    )

    export_btn.click(export_report_fn, inputs=[analysis_data], outputs=[export_status])

    revise_btn.click(generate_revision_fn, inputs=[analysis_data], outputs=[revise_status])

    return (
        verify_file,
        analysis_mode,
        verify_btn,
        analysis_status,
        verdict,
        score,
        confidence,
        evidence,
        findings,
        recommendations,
        summary_display,
        export_btn,
        export_status,
        revise_btn,
        revise_status,
    )


def build_gradio_ui():
    """Build the main Gradio UI with all tabs."""
    with gr.Blocks(title="PoliverAI") as demo:
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

        with gr.Tab("Ask"):
            _create_ask_tab()

        with gr.Tab("Verify"):
            _create_verify_tab()

    return demo
