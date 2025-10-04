#!/usr/bin/env python3
"""Backfill missing report metadata in MongoDB.

This script will connect to the MongoDB instance configured by the
MONGO_URI environment variable (or default to localhost) and iterate the
`reports` collection, setting `type`, `is_full_report`, and attempting to
extract a `verdict` from local report files when available.

Usage:
  MONGO_URI="mongodb://..." python scripts/backfill_reports_metadata.py

This is safe to run multiple times (idempotent): only documents missing
fields will be modified.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Optional

try:
    from pymongo import MongoClient
except Exception as e:
    print("pymongo is required to run this script. Install with: pip install pymongo")
    raise


def infer_type_from_filename(filename: str) -> str:
    fn = (filename or "").lower()
    if fn.startswith("revised-"):
        return "revision"
    if fn.startswith("gdpr-verification") or "verification" in fn:
        return "verification"
    return "other"


def extract_verdict_from_file(path: Path) -> Optional[str]:
    try:
        if not path.exists() or not path.is_file():
            return None
        txt = path.read_text(encoding="utf-8", errors="ignore")
        # look for common markers
        markers = ["**Verdict:**", "Verdict:", "Verdict -", "Verdict —"]
        for marker in markers:
            if marker in txt:
                for line in txt.splitlines():
                    if marker in line:
                        val = line.split(marker, 1)[1].strip()
                        if val:
                            return normalize_verdict(val)
        # fallback: try to find a line starting with 'Verdict' without marker
        for line in txt.splitlines():
            l = line.strip()
            if l.lower().startswith("verdict"):
                parts = l.split(":", 1)
                if len(parts) > 1 and parts[1].strip():
                    return normalize_verdict(parts[1].strip())
        return None
    except Exception:
        return None


def normalize_verdict(s: str) -> str:
    return s.strip().lower().replace(" ", "_").replace("-", "_")


def main():
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        print("MONGO_URI not set, defaulting to mongodb://localhost:27017/poliverai")
        mongo_uri = "mongodb://localhost:27017"

    client = MongoClient(mongo_uri)
    # Use the same DB name as MongoUserDB default
    db = client.get_database("poliverai")
    coll = db.get_collection("reports")

    total = coll.count_documents({})
    print(f"Found {total} report documents in MongoDB")

    updated = 0
    scanned = 0
    for doc in coll.find({}):
        scanned += 1
        updates = {}
        filename = doc.get("filename") or doc.get("path") or ""

        # infer type if missing
        if not doc.get("type"):
            t = infer_type_from_filename(filename)
            updates["type"] = t

        # fill is_full_report if missing
        if doc.get("is_full_report") is None:
            t = updates.get("type") or doc.get("type")
            is_full = bool(doc.get("is_full_report") or (t and str(t).lower() == "verification"))
            updates["is_full_report"] = bool(is_full)

        # try to extract verdict if missing
        if not doc.get("verdict"):
            path = None
            pval = doc.get("path")
            if pval:
                try:
                    path = Path(pval)
                except Exception:
                    path = None
            if path and path.exists():
                v = extract_verdict_from_file(path)
                if v:
                    updates["verdict"] = v

        if updates:
            try:
                coll.update_one({"_id": doc.get("_id")}, {"$set": updates})
                updated += 1
                print(f"Updated {doc.get('filename') or str(doc.get('_id'))}: {updates}")
            except Exception as e:
                print(f"Failed to update {doc.get('filename') or doc.get('_id')}: {e}")

    print(f"Scanned {scanned} docs, updated {updated} docs")


if __name__ == "__main__":
    main()
