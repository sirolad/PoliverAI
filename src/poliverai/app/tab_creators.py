"""Tab creators for the Gradio interface.

This module contains functions to create and organize different tabs
in the Gradio interface.
"""

from __future__ import annotations

import gradio as gr

from .event_handlers import (
    VerifyComponents,
    create_ask_event_handlers,
    create_verify_event_handlers,
)
from .ui_components import (
    create_analysis_mode_guide,
    create_analysis_mode_selector,
    create_export_components,
    create_file_upload_component,
    create_progress_status,
    create_results_components,
    create_revision_components,
    create_verify_button,
)


def create_ask_tab() -> tuple[gr.Textbox, gr.Button, gr.Markdown, gr.JSON]:
    """Create the Ask tab for the UI."""
    q = gr.Textbox(
        label="Question", placeholder="Ask a GDPR/compliance question...", submit_btn=True
    )
    ask_btn = gr.Button("Ask")
    ans = gr.Markdown(label="Answer")
    src = gr.JSON(label="Sources")

    # Set up event handlers
    create_ask_event_handlers(q, ask_btn, ans, src)

    return q, ask_btn, ans, src


def create_verify_tab() -> tuple:  # noqa: PLR0915
    """Create the Verify tab for the UI."""
    with gr.Row():
        with gr.Column(scale=3):
            verify_file = create_file_upload_component()
        with gr.Column(scale=1):
            analysis_mode = create_analysis_mode_selector()

    create_analysis_mode_guide()

    verify_btn = create_verify_button()

    # Progress and status indicators
    with gr.Row():
        analysis_status = create_progress_status()

    # Progress tracking is handled internally by the streaming endpoint

    # Create results components
    (
        summary_display,
        verdict,
        score,
        confidence,
        evidence,
        findings,
        recommendations,
    ) = create_results_components()

    # Export components
    export_btn, export_status, analysis_data = create_export_components()

    # Revision components
    revise_btn, revise_status = create_revision_components()

    # Set up event handlers
    components = VerifyComponents(
        verify_file=verify_file,
        analysis_mode=analysis_mode,
        verify_btn=verify_btn,
        analysis_status=analysis_status,
        verdict=verdict,
        score=score,
        confidence=confidence,
        evidence=evidence,
        findings=findings,
        recommendations=recommendations,
        summary_display=summary_display,
        export_btn=export_btn,
        export_status=export_status,
        revise_btn=revise_btn,
        revise_status=revise_status,
        analysis_data=analysis_data,
    )
    create_verify_event_handlers(components)

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
