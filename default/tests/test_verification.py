from httpx import Response

# Constants
HTTP_OK = 200


def test_verify_endpoint_smoke(client) -> None:
    # Just ensure the endpoint exists and returns JSON when sent a small file
    files = {"file": ("policy.txt", b"Our policy covers data retention and erasure.")}
    r: Response = client.post("/api/v1/verify", files=files)
    assert r.status_code == HTTP_OK
    data = r.json()
    assert "score" in data and "verdict" in data
