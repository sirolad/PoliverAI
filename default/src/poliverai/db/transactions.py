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
        from pymongo import MongoClient
        from pymongo.collection import Collection

        client = MongoClient(MONGO_URI)
        db = client.get_database()
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
    except Exception:
        # If Mongo fails, fall back to in-memory
        transactions = InMemoryTransactions()
else:
    transactions = InMemoryTransactions()
