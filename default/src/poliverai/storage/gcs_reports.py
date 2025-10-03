from __future__ import annotations

import hashlib
import os
import tempfile
from datetime import datetime
from typing import Tuple

try:
    from google.cloud import storage
except Exception:  # pragma: no cover - optional dependency
    storage = None

import logging
logger = logging.getLogger(__name__)


def compute_sha256_for_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def upload_report_if_changed(bucket_name: str, object_path: str, local_path: str) -> Tuple[bool, str]:
    """
    Uploads local_path to GCS bucket in object_path only if the stored object's sha256 metadata
    does not match the computed sha256 for local_path. Returns (uploaded, gcs_object_path).
    """
    if storage is None:
        raise RuntimeError("google-cloud-storage is not available")
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(object_path)

    # Compute sha of local file and compare with GCS metadata
    sha = compute_sha256_for_file(local_path)
    logger.debug("Computed sha256 for %s = %s", local_path, sha)

    # Check existing metadata
    if blob.exists():
        blob.reload()
        meta = blob.metadata or {}
        existing_sha = meta.get("sha256")
        logger.debug("Existing GCS sha256 for gs://%s/%s = %s", bucket_name, object_path, existing_sha)
        if existing_sha == sha:
            # No change; don't overwrite
            logger.info("Skipping upload for %s, checksum unchanged", object_path)
            return False, f"gs://{bucket_name}/{object_path}"

    # Upload and set metadata
    tmp = tempfile.NamedTemporaryFile(delete=False)
    tmp.close()
    try:
        # We upload directly from local_path
        blob.upload_from_filename(local_path)
        # Set metadata with sha256 and last_uploaded
        blob.metadata = blob.metadata or {}
        blob.metadata["sha256"] = sha
        blob.metadata["uploaded_at"] = datetime.utcnow().isoformat() + "Z"
        blob.patch()
        return True, f"gs://{bucket_name}/{object_path}"
    finally:
        try:
            os.unlink(tmp.name)
        except Exception:
            pass
