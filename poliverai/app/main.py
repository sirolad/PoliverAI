import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Route modules are imported lazily inside create_app() to avoid import-time
# failures when optional heavy dependencies (chromadb, tiktoken, etc.) are not
# present in FAST_DEV development builds.


def create_app() -> FastAPI:
    app = FastAPI(title="PoliverAI", version="0.1.0")

    # Add CORS middleware for React frontend
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:3000",
            "http://localhost:8080",
            "http://127.0.0.1:8080",
            # Cloud Run frontend URL (also allow the 'app' service hostname)
            "https://poliverai-app-492258765757.us-central1.run.app",
            "http://poliverai-app-492258765757.us-central1.run.app",
        ],  # React dev servers and proxy
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Lazily import and register routers to avoid hard dependency on optional
    # packages at import time (helps FAST_DEV builds which may omit heavy deps).
    try:
        from .api.routes.auth import router as auth_router

        app.include_router(auth_router, prefix="/auth")
    except Exception as e:  # pragma: no cover - optional during dev
        logging.warning("Auth routes not mounted: %s", e)

    def try_mount(module_path: str, prefix: str | None = None) -> None:
        """Import module and mount `router` if present.

        Accepts relative module paths that start with '.' and resolves them
        to the package absolute path under 'poliverai.app'. Logs a warning if
        the import or mount fails.
        """
        try:
            if module_path.startswith("."):
                # Convert relative '.api.routes.foo' -> 'poliverai.app.api.routes.foo'
                abs_path = f"poliverai.app{module_path}"
            else:
                abs_path = module_path
            mod = __import__(abs_path, fromlist=["router"])
            router = getattr(mod, "router")
            app.include_router(router, prefix=(prefix or ""))
        except Exception as e:  # pragma: no cover - optional during dev
            logging.warning("Failed to mount %s (resolved: %s): %s", module_path, abs_path, e)

    try_mount(".api.routes.verification", "/api/v1")
    try_mount(".api.routes.query", "/api/v1")
    try_mount(".api.routes.comparison", "/api/v1")
    try_mount(".api.routes.reports", "/api/v1")
    try_mount(".api.routes.ingest", "/api/v1")
    try_mount(".api.routes.payments", "/api/v1")
    try_mount(".api.routes.stats", "/api/v1")
    # Lightweight health endpoints used by the frontend and probes. Mount as /api/health
    try_mount(".api.routes.health", "/api")


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
