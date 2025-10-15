#!/usr/bin/env python3
"""
Safe migration utility to reassign documents owned by one user id to another.

Usage (dry-run):
  MONGO_URI="mongodb://..." python scripts/swap_owner_ids.py --from OLD_ID --to NEW_ID

To perform changes (and create backups):
  MONGO_URI="..." python scripts/swap_owner_ids.py --from OLD_ID --to NEW_ID --commit --backup --insecure

Notes:
 - By default the script performs a dry-run and only prints counts and samples.
 - If `--insecure` is provided the MongoClient is created with
   tlsAllowInvalidCertificates=True which disables TLS verification (use only for controlled environments).
 - The script updates `user_id` fields in the `reports` and `transactions` collections.
 - When `--backup` is provided a backup collection named `<collection>_backup_<ts>` is created with the matched documents before updates.
"""
from __future__ import annotations

import argparse
import os
import sys
import logging
from datetime import datetime
from typing import Any, Dict, List

try:
    from pymongo import MongoClient
    from pymongo.errors import PyMongoError
    from bson import ObjectId
except Exception as e:  # pragma: no cover - runtime dependency
    print("Missing dependency: pymongo and bson are required. Install with `pip install pymongo`.")
    raise


logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("swap_owner_ids")


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Swap owner IDs in reports and transactions collections")
    p.add_argument("--from", dest="old_id", required=True, help="Old owner id (24-hex ObjectId or string)")
    p.add_argument("--to", dest="new_id", required=True, help="New owner id (24-hex ObjectId or string)")
    p.add_argument("--commit", action="store_true", help="Apply the updates (default: dry-run)")
    p.add_argument("--backup", action="store_true", help="Create a backup collection of matched documents before updating")
    p.add_argument("--insecure", action="store_true", help="Disable TLS verification (tlsAllowInvalidCertificates=True)")
    p.add_argument("--db", dest="db_name", default=None, help="Database name to use (defaults to database in URI or 'poliverai')")
    return p.parse_args()


def try_objectid(s: str):
    try:
        return ObjectId(s)
    except Exception:
        return None


def connect(uri: str, insecure: bool = False) -> MongoClient:
    opts = {}
    if insecure:
        # Disable TLS certificate verification (use with caution)
        opts["tlsAllowInvalidCertificates"] = True
    client = MongoClient(uri, **opts)
    return client


def collect_matches(coll, old_id_str: str, old_oid: Any) -> Dict[str, Any]:
    """Return counts and a small sample for matches by string and ObjectId forms."""
    queries = []
    queries.append(("string", {"user_id": old_id_str}))
    if old_oid is not None:
        queries.append(("objectid", {"user_id": old_oid}))

    summary = {}
    or_queries = []
    for k, q in queries:
        try:
            cnt = coll.count_documents(q)
        except Exception as e:
            logger.exception("count_documents failed for query %s", q)
            cnt = -1
        sample = []
        try:
            cursor = coll.find(q, {"_id": 1, "user_id": 1}).limit(5)
            for d in cursor:
                sample.append({"_id": str(d.get("_id")), "user_id": d.get("user_id")})
        except Exception:
            sample = []

        summary[k] = {"query": q, "count": cnt, "sample": sample}
        or_queries.append(q)

    # Combined OR query for backup/updates
    combined = {"$or": or_queries} if len(or_queries) > 1 else or_queries[0]
    summary["combined_query"] = combined
    try:
        combined_count = coll.count_documents(combined)
    except Exception:
        combined_count = -1
    summary["combined_count"] = combined_count
    return summary


def preview_collection(db, coll_name: str, old_id_str: str, old_oid: Any) -> Dict[str, Any]:
    coll = db.get_collection(coll_name)
    logger.info("Analyzing collection '%s' for owner id matches", coll_name)
    summary = collect_matches(coll, old_id_str, old_oid)
    logger.info("Found %s matching documents in '%s' (combined)", summary.get("combined_count"), coll_name)
    for k in ("string", "objectid"):
        if k in summary:
            s = summary[k]
            logger.info(" - %s match: count=%s sample=%s", k, s.get("count"), s.get("sample"))
    return summary


def backup_documents(db, coll_name: str, combined_query: Dict[str, Any], backup_suffix: str) -> int:
    coll = db.get_collection(coll_name)
    backup_name = f"{coll_name}_backup_{backup_suffix}"
    bcoll = db.get_collection(backup_name)
    logger.info("Creating backup collection '%s'", backup_name)
    try:
        docs = list(coll.find(combined_query))
        if not docs:
            logger.info("No documents to back up for collection '%s'", coll_name)
            return 0
        # Preserve original _id values; insert_many will keep them unless collisions occur
        bcoll.insert_many(docs)
        logger.info("Backed up %d documents to %s", len(docs), backup_name)
        return len(docs)
    except Exception:
        logger.exception("Failed to back up documents for %s", coll_name)
        return -1


def perform_update(db, coll_name: str, old_id_str: str, old_oid: Any, new_id_str: str, new_oid: Any) -> Dict[str, int]:
    coll = db.get_collection(coll_name)
    results = {"string_updates": 0, "objectid_updates": 0}
    # Update string matches -> set to new_id_str
    try:
        res = coll.update_many({"user_id": old_id_str}, {"$set": {"user_id": new_id_str}})
        results["string_updates"] = int(getattr(res, "modified_count", 0))
        logger.info("Updated %d documents (string matches) in %s", results["string_updates"], coll_name)
    except Exception:
        logger.exception("Failed to update string user_id matches in %s", coll_name)

    # Update ObjectId matches -> set to ObjectId(new)
    if old_oid is not None:
        try:
            if new_oid is not None:
                set_val = new_oid
            else:
                # new id not an ObjectId; store as string
                set_val = new_id_str
            res2 = coll.update_many({"user_id": old_oid}, {"$set": {"user_id": set_val}})
            results["objectid_updates"] = int(getattr(res2, "modified_count", 0))
            logger.info("Updated %d documents (ObjectId matches) in %s", results["objectid_updates"], coll_name)
        except Exception:
            logger.exception("Failed to update ObjectId user_id matches in %s", coll_name)

    return results


def main():
    args = parse_args()
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        logger.error("MONGO_URI environment variable is required")
        sys.exit(2)

    old_id_str = args.old_id
    new_id_str = args.new_id
    old_oid = try_objectid(old_id_str)
    new_oid = try_objectid(new_id_str)

    logger.info("Connecting to MongoDB (insecure=%s)", args.insecure)
    try:
        client = connect(mongo_uri, insecure=args.insecure)
    except Exception:
        logger.exception("Failed to create MongoClient")
        sys.exit(3)

    # Determine database
    db = None
    try:
        db = client.get_database()
    except Exception:
        if args.db_name:
            db = client.get_database(args.db_name)
        else:
            logger.warning("No default database in URI and --db not provided; falling back to 'poliverai'")
            db = client.get_database("poliverai")

    ts = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    collections = ["reports", "transactions"]

    overall_summary = {}

    for coll_name in collections:
        try:
            summary = preview_collection(db, coll_name, old_id_str, old_oid)
            overall_summary[coll_name] = summary
        except Exception:
            logger.exception("Failed to preview collection %s", coll_name)

    if not args.commit:
        logger.info("Dry-run complete. No changes made. Re-run with --commit to apply the updates.")
        return

    # Confirm
    logger.info("COMMIT requested: applying updates. This will modify documents in the DB.")

    for coll_name in collections:
        summary = overall_summary.get(coll_name)
        if not summary:
            logger.warning("Skipping %s: no summary available", coll_name)
            continue

        combined_query = summary.get("combined_query")
        if args.backup:
            bcnt = backup_documents(db, coll_name, combined_query, ts)
            if bcnt < 0:
                logger.warning("Backup failed for %s, aborting updates", coll_name)
                continue

        res = perform_update(db, coll_name, old_id_str, old_oid, new_id_str, new_oid)
        logger.info("Update result for %s: %s", coll_name, res)

    logger.info("Migration complete")


if __name__ == "__main__":
    main()
