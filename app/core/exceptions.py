# ---------------------------------------------------------------------------- #

import fastapi
import logging

# ---------------------------------------------------------------------------- #

logger = logging.getLogger("app.core")

# ---------------------------------------------------------------------------- #


async def exception_handler(
    request: fastapi.Request,
    exception: Exception
) -> fastapi.responses.JSONResponse:
    """
    Exception handler for all unhandled exceptions.
    """
    logger.warning(
        f"Exception for url '{request.url}' handled:\n'{exception}'")
    return fastapi.responses.JSONResponse(
        status_code=fastapi.status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal Server Error"},
        headers=None
    )


# ---------------------------------------------------------------------------- #


async def http_exception_handler(
    request: fastapi.Request,
    exception: Exception
) -> fastapi.responses.JSONResponse:
    """
    Exception handler for all unhandled http exceptions.
    """
    logger.warning(
        f"HTTP Exception handled: '{exception}' for url '{request.url}'.")

    if hasattr(exception, 'status_code'):
        status_code = exception.status_code
    else:
        status_code = fastapi.status.HTTP_500_INTERNAL_SERVER_ERROR

    return fastapi.responses.JSONResponse(
        content={"detail": str(exception.detail) if hasattr(
            exception, 'detail') else "An error occurred"},
        headers=exception.headers if hasattr(
            exception, 'headers') else None,
        status_code=status_code
    )

# ---------------------------------------------------------------------------- #
