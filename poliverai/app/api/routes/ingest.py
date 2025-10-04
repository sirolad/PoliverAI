from __future__ import annotations

import logging
import tempfile
from pathlib import Path

from fastapi import APIRouter, UploadFile, HTTPException
from ....core.auth import verify_token
from ....db.users import user_db
from ....domain.auth import User, UserTier
from ....db.transactions import transactions
from .auth import CURRENT_USER_DEPENDENCY
from pydantic import BaseModel

from ....rag.service import ingest_paths


class IngestResponse(BaseModel):
    files: int
    chunks: int
    skipped: list[dict]


router = APIRouter(tags=["ingest"])


@router.post("/ingest", response_model=IngestResponse)
async def ingest(files: list[UploadFile], current_user: User = CURRENT_USER_DEPENDENCY) -> IngestResponse:
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

        # Charge credits for ingestion for non-PRO users
        try:
            COSTS = {'ingest': 2}
            if current_user and current_user.tier != UserTier.PRO:
                user_record = user_db.get_user_by_id(current_user.id)
                if not user_record:
                    raise HTTPException(status_code=400, detail='User not found')
                cost = int(COSTS['ingest'])
                if (user_record.credits or 0) < cost:
                    raise HTTPException(status_code=402, detail={'message': 'Insufficient credits', 'required': cost, 'available': user_record.credits})
                # Deduct
                user_db.update_user_credits(current_user.id, -cost)
                usd = round(cost / 10.0, 2)
                tx = {
                    'user_email': current_user.email,
                    'event_type': 'charge_ingest',
                    'amount_usd': -usd,
                    'credits': -cost,
                    'description': 'Charge for ingest',
                }
                try:
                    transactions.add(tx)
                except Exception:
                    logging.exception('Failed to record ingest transaction')
        except HTTPException:
            raise
        except Exception:
            logging.exception('Failed to apply ingest charge')

        return IngestResponse(**stats)
    finally:
        # Best-effort cleanup of tempdir
        try:
            for sp in saved_paths:
                Path(sp).unlink(missing_ok=True)
            tmpdir.rmdir()
        except Exception as e:
            logging.warning(f"Failed to cleanup temp files: {e}")
