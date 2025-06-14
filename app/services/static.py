# ---------------------------------------------------------------------------- #

import logging
from typing import Any, Dict
from fastapi import Response
from fastapi.staticfiles import StaticFiles
from starlette.types import Scope

# ---------------------------------------------------------------------------- #

import app.services as services

# ---------------------------------------------------------------------------- #

logger = logging.getLogger("app.core")

# ---------------------------------------------------------------------------- #


class StaticFilesWithHeaders(StaticFiles):
    """
    Custom StaticFiles class to add headers to static file responses.
    """
    _custom_headers: Dict[str, str]

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

        config = services.get_configuration()

        self._custom_headers = config.static_files.headers

        logger.info("Static file serving initialized.")

    async def get_response(self, path: str, scope: Scope) -> Response:
        """
        Override the get_response method to add custom headers. Please note
        that this method is called for each static file request, and it will
        only add headers if the response status code is 200 (OK) and the
        header is not already present in the response.
        """
        response = await super().get_response(path, scope)

        if response.status_code == 200:
            for header, value in self._custom_headers.items():
                if header.lower() not in response.headers:
                    response.headers[header] = value

        return response

# ---------------------------------------------------------------------------- #
