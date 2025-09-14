import pytest
from fastapi.testclient import TestClient

from poliverai.app.main import create_app


@pytest.fixture(scope="session")
def client() -> TestClient:
    app = create_app()
    return TestClient(app)