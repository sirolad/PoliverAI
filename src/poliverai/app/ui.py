"""Main UI module for the Gradio interface.

This module provides the main entry point for building the Gradio UI
using the modular component structure.
"""

from __future__ import annotations

import gradio as gr

from .tab_creators import create_ask_tab, create_verify_tab
from .ui_components import create_main_header


def build_gradio_ui():
    """Build the main Gradio UI with all tabs."""
    with gr.Blocks(title="PoliverAI") as demo:
        create_main_header()

        with gr.Tab("Ask"):
            create_ask_tab()

        with gr.Tab("Verify"):
            create_verify_tab()

    return demo


# For backward compatibility, export the old function names
def _create_ask_tab():
    """Legacy function - use create_ask_tab from tab_creators instead."""
    return create_ask_tab()


def _create_verify_tab():
    """Legacy function - use create_verify_tab from tab_creators instead."""
    return create_verify_tab()


# Export the main build function
__all__ = ["build_gradio_ui", "_create_ask_tab", "_create_verify_tab"]
