import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes.auth import router as auth_router
from .api.routes.ingest import router as ingest_router
from .api.routes.query import router as query_router
from .api.routes.reports import router as reports_router
from .api.routes.verification import router as verification_router


def create_app() -> FastAPI:
    app = FastAPI(title="PoliverAI", version="0.1.0")

    # Add CORS middleware for React frontend
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
        allow_origins=[
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:3000",
            "http://localhost:4200",
            "http://127.0.0.1:4200",
        ],
        allow_origin_regex=r"^https?://(?:localhost|127\.0\.0\.1)(?::\d+)?$",
        allow_credentials=True,
        allow_methods=["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
        allow_headers=["content-type"],
        max_age=600,
    )

    # Add CORS middleware for React frontend (kept for non-OPTIONS requests)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:3000",
            "http://localhost:4200",
            "http://127.0.0.1:4200",
        ],  # React dev servers
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth_router, prefix="/auth")
    app.include_router(verification_router, prefix="/api/v1")
    app.include_router(query_router, prefix="/api/v1")
    app.include_router(reports_router, prefix="/api/v1")
    app.include_router(ingest_router, prefix="/api/v1")

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
