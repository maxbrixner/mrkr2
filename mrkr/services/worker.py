# ---------------------------------------------------------------------------- #

import concurrent.futures
import logging
from typing import Any
from functools import lru_cache

# ---------------------------------------------------------------------------- #

import mrkr.services as services

# ---------------------------------------------------------------------------- #

logger = logging.getLogger("mrkr.services")

# ---------------------------------------------------------------------------- #


class WorkerPool(concurrent.futures.ThreadPoolExecutor):
    """
    Custom ThreadPoolExecutor that can be extended with additional methods
    or properties if needed in the future.
    """

    def __init__(self) -> None:
        """
        Initialize the WorkerPool with a maximum number of workers
        based on the configuration.
        """
        config = services.get_configuration()
        super().__init__(max_workers=config.backend.max_workers)
        logger.info(f"WorkerPool initialized (with a maximum of "
                    f"{config.backend.max_workers} workers).")

    def submit(self, *args: Any, **kwargs: Any) -> concurrent.futures.Future:
        """
        Submit a task to the worker pool.
        """
        logger.debug("Submitting task to worker pool.")
        return super().submit(*args, **kwargs)

    def shutdown(self, *args: Any, **kwargs: Any) -> None:
        """
        Shutdown the worker pool gracefully.
        """
        logger.info("Shutting down worker pool.")
        super().shutdown(*args, **kwargs)

# ---------------------------------------------------------------------------- #


@lru_cache
def get_worker_pool() -> concurrent.futures.ThreadPoolExecutor:
    """
    Returns a ThreadPoolExecutor instance for managing worker threads.
    """
    return WorkerPool()

# ---------------------------------------------------------------------------- #
