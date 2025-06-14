# ---------------------------------------------------------------------------- #

import logging
from fastapi import Request, Response
from fastapi.templating import Jinja2Templates
from functools import lru_cache
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from typing import Awaitable, Callable, Dict

# ---------------------------------------------------------------------------- #

import app.services as services

# ---------------------------------------------------------------------------- #

logger = logging.getLogger("app.services")

# ---------------------------------------------------------------------------- #


@lru_cache
def get_templates() -> Jinja2Templates:
    """
    Returns a Jinja2Templates instance configured with the templates directory.
    """
    config = services.get_configuration()

    if not config.templates.enabled:
        raise Exception(
            "Templates are not enabled in the configuration.")

    return Jinja2Templates(directory=config.templates.directory)

# ---------------------------------------------------------------------------- #


class TemplateHeaderMiddleware(BaseHTTPMiddleware):
    """
    Middleware to add custom headers to HTML responses. Please note
    that this middleware will not add headers to Swagger UI responses.
    It is designed to be used with FastAPI applications that serve HTML
    templates, such as those rendered with Jinja2.
    """
    _custom_headers: Dict[str, str]
    _swagger_path: str | None

    def __init__(
        self,
        app: ASGIApp,
        dispatch: Callable[[Request, Callable[[
            Request], Awaitable[Response]]], Awaitable[Response]] | None = None
    ) -> None:
        """
        Initializes the TemplateHeaderMiddleware.
        """
        super().__init__(app, dispatch)

        config = services.get_configuration()

        self._custom_headers = config.templates.headers
        self._swagger_path = config.project.swagger_path

        logger.info("Template headers middleware initialized")

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        """
        Custom dispatch method to add headers to HTML responses. Please note
        that this method will not add headers to Swagger UI responses and
        will only add headers to responses that have a content type of
        "text/html". It will only add headers if they are not already
        present in the response headers.
        """
        response = await call_next(request)

        if "text/html" in response.headers.get("content-type", "") \
                and request.scope["path"] != self._swagger_path:
            for header, value in self._custom_headers.items():
                if header.lower() not in response.headers:
                    response.headers[header] = value

        return response

# ---------------------------------------------------------------------------- #
