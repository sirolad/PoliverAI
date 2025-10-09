from fastapi import APIRouter, HTTPException
from typing import Dict
import os
from datetime import datetime
try:
    from ....db.mongo import MongoUserDB
except Exception:  # pragma: no cover - optional dependency
    MongoUserDB = None

from poliverai.core.config import get_settings

router = APIRouter()


@router.get("/stats/summary")
async def stats_summary() -> Dict[str, int]:
    """Return aggregated counts for report categories across the app.

    - free_reports: reports created in 'fast' analysis mode
    - full_reports: reports created in other analysis modes
    - ai_policy_reports: reports with a tag 'ai_policy' (best-effort)
    - total_downloads: read from a 'site_stats' collection if present
    """
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri or not MongoUserDB:
        return {"free_reports": 0, "full_reports": 0, "ai_policy_reports": 0, "total_downloads": 0, "total_reports": 0}

    try:
        mdb = MongoUserDB(mongo_uri)
        reports_coll = mdb.db.get_collection("reports")
        # total reports ever in the collection
        total_reports = int(reports_coll.count_documents({}))
        # number of full reports (analysis_mode != 'fast')
        full = int(reports_coll.count_documents({"analysis_mode": {"$ne": "fast"}}))

        # Prefer counting free analyses from the transactions collection when available.
        # Transactions are emitted for every analysis (including zero-cost/free analyses)
        # so they are a reliable source for 'free' usage counts. Fall back to the
        # derived method (total - full) if transactions collection isn't available.
        free = None
        try:
            tx_coll = mdb.db.get_collection("transactions")
            # Count transactions that represent completed, zero-credit analyses.
            # This matches how verification/analysis routes emit free transactions:
            # event_type: 'analysis', credits: 0, status: 'completed'
            free_by_tx = int(tx_coll.count_documents({"event_type": "analysis", "credits": 0}))
            free = free_by_tx
        except Exception:
            # If transactions collection isn't available or the query fails, we'll
            # compute free by subtraction as a fallback.
            free = None

        if free is None:
            free = max(0, total_reports - full)

        # Count AI-related revised policies. Historically this was stored
        # as a report with a tag 'ai_policy', but revised policies are now
        # persisted with type == 'revision'. Count either form so the
        # frontend receives a consistent 'ai_policy_reports' value.
        try:
            ai_policy = int(reports_coll.count_documents({"$or": [{"tags": "ai_policy"}, {"type": "revision"}]}))
        except Exception:
            # Fallback: try the older tag-only query if the composite query fails
            ai_policy = int(reports_coll.count_documents({"tags": "ai_policy"}))

        stats_coll = mdb.db.get_collection("site_stats")
        stats_doc = stats_coll.find_one({"_id": "global"}) or {}
        total_downloads = int(stats_doc.get("total_downloads", 0))
        # total users: prefer MongoUserDB helper if available, else count documents
        try:
            total_users = int(mdb.get_user_count())
        except Exception:
            try:
                users_coll = mdb.db.get_collection("users")
                total_users = int(users_coll.count_documents({}))
            except Exception:
                total_users = 0

        # total_subscriptions: count users with a future subscription_expires timestamp
        try:
            users_coll = mdb.db.get_collection("users")
            total_subscriptions = int(users_coll.count_documents({"subscription_expires": {"$gt": datetime.utcnow()}}))
        except Exception:
            total_subscriptions = 0

        return {
            "free_reports": int(free),
            "full_reports": int(full),
            "ai_policy_reports": int(ai_policy),
            "total_downloads": total_downloads,
            "total_reports": int(total_reports),
            "total_users": int(total_users),
            "total_subscriptions": int(total_subscriptions),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compute stats: {e}") from e


@router.post("/stats/downloads")
async def increment_downloads() -> Dict[str, int]:
    """Increment a global downloads counter stored in 'site_stats' collection.

    This endpoint is intentionally minimal and does not require auth. It will create
    the document if it does not exist.
    """
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri or not MongoUserDB:
        return {"total_downloads": 0}

    try:
        mdb = MongoUserDB(mongo_uri)
        stats_coll = mdb.db.get_collection("site_stats")
        res = stats_coll.find_one_and_update({"_id": "global"}, {"$inc": {"total_downloads": 1}}, upsert=True, return_document=True)
        total = int(res.get("total_downloads", 0)) if res else int(stats_coll.find_one({"_id": "global"}).get("total_downloads", 0))
        return {"total_downloads": total}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to increment downloads: {e}") from e
