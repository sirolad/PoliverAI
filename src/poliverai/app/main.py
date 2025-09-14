from fastapi import FastAPI
from .api.routes.verification import router as verification_router
from .api.routes.query import router as query_router
from .api.routes.comparison import router as comparison_router
from .api.routes.reports import router as reports_router


def create_app() -> FastAPI:
    app = FastAPI(title="PoliverAI", version="0.1.0")

    app.include_router(verification_router, prefix="/api/v1")
    app.include_router(query_router, prefix="/api/v1")
    app.include_router(comparison_router, prefix="/api/v1")
    app.include_router(reports_router, prefix="/api/v1")

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()