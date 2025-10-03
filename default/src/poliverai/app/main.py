import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes.auth import router as auth_router
from .api.routes.comparison import router as comparison_router
from .api.routes.ingest import router as ingest_router
from .api.routes.query import router as query_router
from .api.routes.reports import router as reports_router
from .api.routes.verification import router as verification_router
from .api.routes.payments import router as payments_router


def create_app() -> FastAPI:
    app = FastAPI(title="PoliverAI", version="0.1.0")

    # Add CORS middleware for React frontend
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:3000",
        ],  # React dev servers
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth_router, prefix="/auth")
    app.include_router(verification_router, prefix="/api/v1")
    app.include_router(query_router, prefix="/api/v1")
    app.include_router(comparison_router, prefix="/api/v1")
    app.include_router(reports_router, prefix="/api/v1")
    app.include_router(ingest_router, prefix="/api/v1")
    app.include_router(payments_router, prefix="/api/v1")

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    # Mount Gradio UI at /ui
    try:
        import gradio as gr  # type: ignore

        from .ui import build_gradio_ui

        demo = build_gradio_ui()
        gr.mount_gradio_app(app, demo, path="/ui")
    except Exception as e:
        # If Gradio is not available or UI fails to build, continue without UI
        logging.warning(f"Failed to mount Gradio UI: {e}")

    return app


app = create_app()

# Note: local Socket.IO app removed in favor of HTTP/SSE streaming endpoints


# Register shutdown hook to persist Chroma store to GCS if configured
@app.on_event("shutdown")
def upload_chroma_on_shutdown() -> None:
    try:
        import os

        from ..core.config import get_settings

        settings = get_settings()
        gcs_bucket = settings.chroma_gcs_bucket or settings.gcs_bucket or os.getenv("POLIVERAI_CHROMA_GCS_BUCKET")
        gcs_object = os.getenv("POLIVERAI_CHROMA_GCS_OBJECT")
        if gcs_bucket:
            # Import the helper lazily to avoid forcing google-cloud-storage at import time
            from ..rag.service import _gcs_upload_persist

            if not gcs_object:
                gcs_object = f"{settings.chroma_collection}.tar.gz"
            _gcs_upload_persist(gcs_bucket, gcs_object, settings.chroma_persist_dir)
    except Exception as e:
        logging.warning("Failed to upload chroma persist on shutdown: %s", e)
