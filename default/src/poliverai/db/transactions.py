"""Simple transactions storage used to record payment events for development.

Stores transactions in-memory by default. If MONGO_URI is present, uses a
MongoDB collection named `transactions` to persist records.
"""
from __future__ import annotations

import os
import uuid
from datetime import datetime
from typing import List, Optional

MONGO_URI = os.getenv("MONGO_URI")


class InMemoryTransactions:
    def __init__(self):
        self.items: List[dict] = []

    def add(self, record: dict) -> dict:
        rec = dict(record)
        rec.setdefault("id", str(uuid.uuid4()))
        rec.setdefault("timestamp", datetime.utcnow())
        self.items.append(rec)
        return rec

    def list_for_user(self, user_email: str) -> List[dict]:
        return [r for r in self.items if r.get("user_email") == user_email]


if MONGO_URI:
    try:
        import logging
        from pymongo import MongoClient
        from pymongo.collection import Collection

        logger = logging.getLogger(__name__)

        client = MongoClient(MONGO_URI)
        # Try to get the database specified in the URI; if none is present,
        # fall back to the same default used elsewhere in the app ('poliverai').
        try:
            db = client.get_database()
        except Exception:
            logger.debug("No default DB found in URI; falling back to 'poliverai'")
            db = client.get_database("poliverai")

        transactions_coll: Collection = db.get_collection("transactions")


        class MongoTransactions:
            def add(self, record: dict) -> dict:
                r = dict(record)
                r.setdefault("timestamp", datetime.utcnow())
                result = transactions_coll.insert_one(r)
                r["id"] = str(result.inserted_id)
                return r

            def list_for_user(self, user_email: str) -> List[dict]:
                docs = transactions_coll.find({"user_email": user_email}).sort("timestamp", -1)
                out = []
                for d in docs:
                    d["id"] = str(d.get("_id"))
                    d.pop("_id", None)
                    out.append(d)
                return out


        transactions = MongoTransactions()
        # Ensure the transactions collection has at least one dummy document so it
        # becomes visible in MongoDB UI tools. This is a benign dev-time seed.
        try:
            count = transactions_coll.count_documents({})
            if count == 0:
                sample = {
                    'user_email': 'system@local',
                    'event_type': 'seed',
                    'amount_usd': 0.0,
                    'credits': 0,
                    'description': 'Initial seed document',
                    'timestamp': datetime.utcnow(),
                }
                transactions_coll.insert_one(sample)
        except Exception:
            # Non-fatal: if counting/inserting fails, continue without blocking startup
            logger.exception('Failed to seed transactions collection; continuing with in-memory fallback')
    except Exception:
        # If Mongo fails, fall back to in-memory and log the error so it's visible
        import logging
        logger = logging.getLogger(__name__)
        logger.exception('MongoTransactions initialization failed, using in-memory transactions')
        transactions = InMemoryTransactions()
else:
    transactions = InMemoryTransactions()
