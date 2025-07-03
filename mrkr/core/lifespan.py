# ---------------------------------------------------------------------------- #

import fastapi
import logging

# ---------------------------------------------------------------------------- #

from contextlib import asynccontextmanager
from typing import AsyncGenerator

# ---------------------------------------------------------------------------- #

import mrkr.database as database
import mrkr.services as services

# ---------------------------------------------------------------------------- #

logger = logging.getLogger("mrkr.core")

# ---------------------------------------------------------------------------- #


@asynccontextmanager
async def lifespan(app: fastapi.FastAPI) -> AsyncGenerator[None, None]:
    """
    Context manager for FastAPI lifespan events. Handles application startup
    and shutdown logic.
    """
    database_instance = database.get_database()

    database_instance.connect()

    worker_pool = services.get_worker_pool()

    logger.info("Application startup complete.")

    yield

    database_instance.disconnect()

    worker_pool.shutdown(wait=True)

    logger.info("Application shutdown complete.")

# ---------------------------------------------------------------------------- #
