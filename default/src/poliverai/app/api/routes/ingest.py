from __future__ import annotations

import logging
import tempfile
from pathlib import Path

from fastapi import APIRouter, UploadFile
from pydantic import BaseModel

from ....rag.service import ingest_paths


class IngestResponse(BaseModel):
    files: int
    chunks: int
    skipped: list[dict]


router = APIRouter(tags=["ingest"])


@router.post("/ingest", response_model=IngestResponse)
async def ingest(files: list[UploadFile]) -> IngestResponse:
    tmpdir = Path(tempfile.mkdtemp(prefix="poliverai_ingest_"))
    saved_paths: list[str] = []
    try:
        for f in files:
            suffix = Path(f.filename).suffix if f.filename else ""
            p = tmpdir / f"upload{len(saved_paths)}{suffix}"
            data = await f.read()
            p.write_bytes(data)
            saved_paths.append(str(p))
        stats = ingest_paths(saved_paths)
        return IngestResponse(**stats)
    finally:
        # Best-effort cleanup of tempdir
        try:
            for sp in saved_paths:
                Path(sp).unlink(missing_ok=True)
            tmpdir.rmdir()
        except Exception as e:
            logging.warning(f"Failed to cleanup temp files: {e}")
