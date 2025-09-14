from httpx import Response


def test_verify_endpoint_smoke(client) -> None:
    # Just ensure the endpoint exists and returns JSON when sent a small file
    files = {"file": ("policy.txt", b"Our policy covers data retention and erasure.")}
    r: Response = client.post("/api/v1/verify", files=files)
    assert r.status_code == 200
    data = r.json()
    assert "score" in data and "verdict" in data