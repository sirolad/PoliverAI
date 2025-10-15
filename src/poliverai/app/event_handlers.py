"""Event handlers for the Gradio interface.

This module contains all the event handling logic for user interactions
in the Gradio interface.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass

import gradio as gr
import requests

from .summary_generator import (
    generate_comprehensive_summary,
    generate_success_status,
    get_verdict_emoji,
)
from .ui_components import (
    format_verdict_display,
)

# Build absolute API base so requests has a scheme/host
# Defaults to localhost and the current PORT; can be overridden via env.
DEFAULT_HOST = os.getenv("POLIVERAI_UI_HOST", "127.0.0.1")
DEFAULT_PORT = os.getenv("PORT", "8000")
API_BASE = os.getenv("POLIVERAI_UI_API_BASE", f"http://{DEFAULT_HOST}:{DEFAULT_PORT}/api/v1")


def _post_json(path: str, payload: dict) -> dict:
    """Make a JSON POST request to the API."""
    try:
        r = requests.post(path, json=payload, timeout=60)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        return {"error": str(e)}


def _post_files(path: str, files: list[tuple], data: dict = None) -> dict:
    """Make a file POST request to the API."""
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


def create_ask_event_handlers(
    q: gr.Textbox, ask_btn: gr.Button, ans: gr.Markdown, src: gr.JSON
) -> None:
    """Create event handlers for the Ask tab."""

    def ask_fn(question: str):
        if not question.strip():
            return "Please enter a question.", []
        data = _post_json(f"{API_BASE}/query", {"question": question})
        if "error" in data:
            return f"Error: {data['error']}", []
        return data.get("answer", ""), data.get("sources", [])

    ask_btn.click(ask_fn, inputs=[q], outputs=[ans, src])
    q.submit(ask_fn, inputs=[q], outputs=[ans, src])


# Helper functions for verification
def _create_error_result(error_msg: str) -> tuple:
    """Create a standard error result tuple."""
    return (
        error_msg,
        "**Verdict:** Error occurred",
        0,
        0.0,
        [],
        [],
        [],
        error_msg,
        gr.update(visible=False),
        "",
        gr.update(visible=False),
        "",
    )


def _create_no_file_result() -> tuple:
    """Create a result tuple for when no file is selected."""
    return (
        "No file selected",
        "**Verdict:** No file selected",
        0,
        0.0,
        [],
        [],
        [],
        "Please upload a document to analyze",
        gr.update(visible=False),
        "",
        gr.update(visible=False),
        "",
    )


def _create_success_result(result: dict, selected_mode: str) -> tuple:
    """Create a success result tuple from API response."""
    analysis_verdict = result.get("verdict", "unknown")
    analysis_score = int(result.get("score", 0))
    analysis_confidence = float(result.get("confidence", 0.0))
    analysis_evidence = result.get("evidence", [])
    analysis_findings = result.get("findings", [])
    analysis_recommendations = result.get("recommendations", [])

    # Format displays
    verdict_display = format_verdict_display(analysis_verdict, analysis_score, analysis_confidence)

    # Get verdict emoji and generate comprehensive summary
    emoji = get_verdict_emoji(analysis_verdict)
    comprehensive_summary = generate_comprehensive_summary(
        result, selected_mode, emoji, analysis_verdict, analysis_score
    )

    # Generate success status
    success_status = generate_success_status(
        analysis_verdict, analysis_score, selected_mode, result.get("metrics", {})
    )

    return (
        success_status,
        verdict_display,
        analysis_score,
        analysis_confidence,
        analysis_evidence,
        analysis_findings,
        analysis_recommendations,
        comprehensive_summary,
        gr.update(visible=True),
        "",
        gr.update(visible=True),
        "",
    )


def _create_analysis_data_dict(result: tuple, selected_mode: str, uploaded_file) -> dict:
    """Create analysis data dictionary for export/revision."""
    with open(uploaded_file.name, "rb") as f:
        file_content = f.read()

    return {
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
            "total_fulfills": len([e for e in result[4] if "fulfills" in str(e).lower()]),
            "critical_violations": len([f for f in result[5] if f.get("severity") == "high"]),
        },
    }


@dataclass
class VerifyComponents:
    """Container for verify tab UI components."""

    verify_file: gr.File
    analysis_mode: gr.Radio
    verify_btn: gr.Button
    analysis_status: gr.Markdown
    verdict: gr.Markdown
    score: gr.Number
    confidence: gr.Number
    evidence: gr.JSON
    findings: gr.JSON
    recommendations: gr.JSON
    summary_display: gr.Markdown
    export_btn: gr.Button
    export_status: gr.Markdown
    revise_btn: gr.Button
    revise_status: gr.Markdown
    analysis_data: gr.State


def create_verify_event_handlers(components: VerifyComponents) -> None:
    """Create event handlers for the Verify tab."""

    def verify_fn(uploaded_file, selected_mode):
        """Main verification function."""
        if not uploaded_file:
            return _create_no_file_result()

        try:
            with open(uploaded_file.name, "rb") as f:
                files = [
                    ("file", (os.path.basename(uploaded_file.name), f, "application/octet-stream"))
                ]
                data = {"analysis_mode": selected_mode}
                result = _post_files_streaming(f"{API_BASE}/verify-stream", files, data)

            if "error" in result:
                error_msg = f"❌ Analysis failed: {result['error']}"
                return _create_error_result(error_msg)

            return _create_success_result(result, selected_mode)

        except Exception as e:
            error_msg = f"❌ Unexpected error: {str(e)}"
            return _create_error_result(error_msg)

    def export_report_fn(analysis_data_dict):
        """Export analysis report."""
        if not analysis_data_dict:
            return "❌ No analysis data available for export"

        try:
            response = _post_json(f"{API_BASE}/reports/export", analysis_data_dict)
            if "error" in response:
                return f"❌ Export failed: {response['error']}"

            download_url = response.get("download_url", "")
            if download_url:
                return f"✅ Report exported successfully! [Download Report]({download_url})"
            else:
                return "✅ Report exported successfully!"
        except Exception as e:
            return f"❌ Export error: {str(e)}"

    def generate_revision_fn(analysis_data_dict):
        """Generate revised policy."""
        if not analysis_data_dict:
            return "❌ No analysis data available for revision"

        try:
            response = _post_json(f"{API_BASE}/reports/revision", analysis_data_dict)
            if "error" in response:
                return f"❌ Revision failed: {response['error']}"

            revised_policy = response.get("revised_policy", "")
            if revised_policy:
                return (
                    f"✅ Revised policy generated successfully!\n\n"
                    f"**Revised Policy:**\n{revised_policy[:500]}..."
                )
            else:
                return "✅ Revised policy generated successfully!"
        except Exception as e:
            return f"❌ Revision error: {str(e)}"

    def verify_fn_wrapper(uploaded_file, selected_mode):
        """Wrapper function to handle analysis data storage."""
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
                analysis_data_dict = _create_analysis_data_dict(
                    result, selected_mode, uploaded_file
                )
                return result + (analysis_data_dict,)
            except Exception as e:
                # Log the error but don't prevent verification from completing
                print(f"Warning: Failed to store analysis data for export: {e}")

        return result + (None,)

    # Set up event handlers
    components.verify_btn.click(
        verify_fn_wrapper,
        inputs=[components.verify_file, components.analysis_mode],
        outputs=[
            components.analysis_status,
            components.verdict,
            components.score,
            components.confidence,
            components.evidence,
            components.findings,
            components.recommendations,
            components.summary_display,
            components.export_btn,
            components.export_status,
            components.revise_btn,
            components.revise_status,
            components.analysis_data,
        ],
    )

    components.export_btn.click(
        export_report_fn, inputs=[components.analysis_data], outputs=[components.export_status]
    )
    components.revise_btn.click(
        generate_revision_fn, inputs=[components.analysis_data], outputs=[components.revise_status]
    )
