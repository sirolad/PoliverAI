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

    def get_by_session_or_id(self, session_or_id: str) -> Optional[dict]:
        for r in self.items:
            if str(r.get('session_id')) == session_or_id or str(r.get('id')) == session_or_id:
                return r
        return None

    def update(self, session_or_id: str, updates: dict) -> Optional[dict]:
        found = self.get_by_session_or_id(session_or_id)
        if not found:
            return None
        found.update(updates)
        return found


if MONGO_URI:
    try:
        import logging
        from pymongo import MongoClient
        from pymongo.collection import Collection

        logger = logging.getLogger(__name__)

        # Create MongoClient using the provided URI. Do not attempt cert-based
        # auth here; rely on the URI's username/password and the environment's
        # trust store. Use short timeouts so failures don't hang startup.
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000, connectTimeoutMS=2000)
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
                try:
                    result = transactions_coll.insert_one(r)
                    r["id"] = str(result.inserted_id)
                    return r
                except Exception:
                    # If Mongo write fails (e.g. TLS error), log and return the
                    # original record as a best-effort fallback for dev flows.
                    logger.exception('Failed to insert transaction record; returning local copy')
                    r.setdefault('id', str(uuid.uuid4()))
                    return r

            def list_for_user(self, user_email: str) -> List[dict]:
                try:
                    docs = transactions_coll.find({"user_email": user_email}).sort("timestamp", -1)
                    out = []
                    for d in docs:
                        d["id"] = str(d.get("_id"))
                        d.pop("_id", None)
                        out.append(d)
                    return out
                except Exception:
                    # On read errors (e.g. Atlas TLS), log and return empty list
                    logger.exception('Failed to read transactions from Mongo; returning empty list')
                    return []

            def get_by_session_or_id(self, session_or_id: str) -> Optional[dict]:
                try:
                    # Try session_id match first
                    doc = transactions_coll.find_one({"session_id": session_or_id})
                    if not doc:
                        # Try by Mongo _id
                        try:
                            from bson import ObjectId

                            doc = transactions_coll.find_one({"_id": ObjectId(session_or_id)})
                        except Exception:
                            doc = None
                    if not doc:
                        return None
                    doc["id"] = str(doc.get("_id"))
                    doc.pop("_id", None)
                    return doc
                except Exception:
                    logger.exception('Failed to fetch transaction from Mongo; returning None')
                    return None

            def update(self, session_or_id: str, updates: dict) -> Optional[dict]:
                # Update by session_id if possible, otherwise by _id
                filter_q = {"session_id": session_or_id}
                try:
                    result = transactions_coll.update_one(filter_q, {"$set": updates})
                    if result.modified_count == 0:
                        # Try by ObjectId
                        from bson import ObjectId

                        try:
                            result = transactions_coll.update_one({"_id": ObjectId(session_or_id)}, {"$set": updates})
                        except Exception:
                            pass
                except Exception:
                    try:
                        # fallback: maybe session_or_id is an ObjectId string
                        from bson import ObjectId

                        transactions_coll.update_one({"_id": ObjectId(session_or_id)}, {"$set": updates})
                    except Exception:
                        logger.exception('Failed to update transaction in Mongo; returning None')
                        return None

                return self.get_by_session_or_id(session_or_id)


        transactions = MongoTransactions()
        # NOTE: we intentionally avoid performing any read/write operations at
        # import time (like count_documents or insert_one). Those can block the
        # import when MongoDB/Atlas is unreachable and will cause the whole
        # application to hang on startup. Seeding the collection is optional for
        # dev UX and should be performed explicitly by a migration or admin
        # task if desired.
    except Exception:
        # If Mongo fails, fall back to in-memory and log the error so it's visible
        import logging
        logger = logging.getLogger(__name__)
        logger.exception('MongoTransactions initialization failed, using in-memory transactions')
        transactions = InMemoryTransactions()
else:
    transactions = InMemoryTransactions()
