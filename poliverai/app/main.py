import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Route modules are imported lazily inside create_app() to avoid import-time
# failures when optional heavy dependencies (chromadb, tiktoken, etc.) are not
# present in FAST_DEV development builds.


def create_app() -> FastAPI:
    app = FastAPI(title="PoliverAI", version="0.1.0")
    # Configure allowed CORS origins. In local development you can set
    # POLIVERAI_ALLOW_ALL_ORIGINS=1 to allow '*' (useful when using proxies).
    import os

    default_origins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://localhost:8080",
        "http://localhost:4200",
        "http://127.0.0.1:4200",
        "http://127.0.0.1:8080",
        # Cloud Run frontend URL (also allow the 'app' service hostname)
        "https://poliverai-app-492258765757.us-central1.run.app",
        "https://poliverai.com",
        "http://poliverai-app-492258765757.us-central1.run.app",
        "http://poliverai.com",
    ]

    allow_all = os.getenv("POLIVERAI_ALLOW_ALL_ORIGINS", "0") in ("1", "true", "True")
    allowed = ["*"] if allow_all else default_origins

    # Add CORS middleware for React frontend. In development allow a localhost
    # origin regex fallback so developers can use different ports without
    # having to enumerate every possible localhost:port combination.
    allow_origin_regex = None
    if not allow_all:
        # Matches http://localhost:1234 and http://127.0.0.1:4200 etc.
        allow_origin_regex = r"^https?://(?:localhost|127\.0\.0\.1)(?::\d+)?$"

    # Lightweight ASGI middleware that handles OPTIONS preflight requests
    # and emits the Access-Control-Allow-* headers using the same origin
    # allowlist/regex logic. We keep the normal CORSMiddleware for non-OPTIONS
    # traffic, but some deployments may reject preflight before CORSMiddleware
    # runs; handling OPTIONS early ensures browsers receive the required
    # Access-Control-Allow-Origin header so dev setups using varied
    # localhost ports work reliably.
    import re
    from starlette.responses import PlainTextResponse

    class _PreflightMiddleware:
        def __init__(self, app, allow_origins, allow_origin_regex, allow_credentials, allow_methods, allow_headers, max_age=600):
            self.app = app
            self.allow_origins = allow_origins or []
            self.allow_origin_regex = re.compile(allow_origin_regex) if allow_origin_regex else None
            self.allow_credentials = allow_credentials
            self.allow_methods = ", ".join(allow_methods) if isinstance(allow_methods, (list, tuple)) else str(allow_methods)
            self.allow_headers = ", ".join(allow_headers) if isinstance(allow_headers, (list, tuple)) else str(allow_headers)
            self.max_age = str(max_age)

        async def __call__(self, scope, receive, send):
            # Only handle HTTP requests here
            if scope.get("type") != "http":
                await self.app(scope, receive, send)
                return

            method = scope.get("method", "").upper()
            headers = {k.decode().lower(): v.decode() for k, v in scope.get("headers", [])}
            origin = headers.get("origin")

            # Emit a log entry so we can inspect the incoming Origin and the
            # configured allowlist/regex. Use info so it's visible under typical
            # uvicorn logging configurations.
            try:
                logging.info("PreflightMiddleware: method=%s path=%s Origin=%s allowed=%s", method, scope.get("path"), origin, self.allow_origins)
            except Exception:
                logging.exception("Failed to log preflight origin")

            if method == "OPTIONS":
                # Preflight: decide whether origin is allowed
                allowed_origin_value = None
                if not origin:
                    allowed_origin_value = "*"
                elif "*" in self.allow_origins:
                    allowed_origin_value = "*"
                elif origin in self.allow_origins:
                    allowed_origin_value = origin
                elif self.allow_origin_regex and self.allow_origin_regex.match(origin):
                    allowed_origin_value = origin

                if not allowed_origin_value:
                    resp = PlainTextResponse("Disallowed CORS origin", status_code=400)
                else:
                    resp_headers = {
                        "access-control-allow-origin": allowed_origin_value,
                        "access-control-allow-methods": self.allow_methods,
                        "access-control-allow-headers": self.allow_headers,
                        "access-control-max-age": self.max_age,
                    }
                    if self.allow_credentials:
                        resp_headers["access-control-allow-credentials"] = "true"
                    resp = PlainTextResponse("", status_code=200, headers=resp_headers)

                await resp(scope, receive, send)
                return

            # For non-OPTIONS requests, continue to the next middleware
            await self.app(scope, receive, send)

    # Insert preflight middleware before CORSMiddleware so it can short-circuit
    # and return CORS headers for browser preflight requests.
    app.add_middleware(
        _PreflightMiddleware,
        allow_origins=allowed,
        allow_origin_regex=allow_origin_regex,
        allow_credentials=True,
        allow_methods=["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
        allow_headers=["content-type"],
        max_age=600,
    )

    # Add CORS middleware for React frontend (kept for non-OPTIONS requests)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed,
        allow_origin_regex=allow_origin_regex,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Log allowed origins at startup for easier debugging
    logging.info("CORS allowed origins: %s", ",".join(allowed))

    # Debugging middleware: emit incoming Origin headers at debug level so
    # we can see what the browser is sending during preflight requests.
    @app.middleware("http")
    async def _log_origin_middleware(request, call_next):
        try:
            origin = request.headers.get("origin")
            if origin:
                logging.debug("Incoming request %s %s Origin=%s", request.method, request.url.path, origin)
        except Exception:
            logging.exception("Failed to log origin header")
        return await call_next(request)

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
