"""Lightweight health endpoints that do not access the database.

These are safe to call from the frontend (or probes) to detect backend liveness
without triggering MongoDB connections that might fail in some environments.
"""
from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "backend"}


@router.get("/ping")
def ping() -> dict:
    return {"status": "ok", "time": "now"}
