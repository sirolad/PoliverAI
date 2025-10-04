import asyncio
import logging
import os
from typing import Any

import socketio

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
app = socketio.ASGIApp(sio)

logger = logging.getLogger(__name__)


@sio.event
async def connect(sid, environ):
    logger.info("Socket connected: %s", sid)


@sio.event
async def disconnect(sid):
    logger.info("Socket disconnected: %s", sid)


async def emit_progress(sid: str, event: str, data: Any) -> None:
    """Helper to emit progress to a specific client sid."""
    try:
        await sio.emit(event, data, to=sid)
    except Exception as e:
        logger.warning("Failed to emit progress to %s: %s", sid, e)
