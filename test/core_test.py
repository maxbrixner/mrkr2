# ---------------------------------------------------------------------------- #

import fastapi
from fastapi.exceptions import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from unittest.mock import patch
from contextlib import ExitStack

# ---------------------------------------------------------------------------- #

import app.core as core
import app.services as services
from app.core.exceptions import exception_handler, http_exception_handler
from test._testcase import TestCase

# ---------------------------------------------------------------------------- #


class TestApp(TestCase):
    """
    Test cases for the application's main functionality.
    """

    def test_create_app(self) -> None:
        """
        Test if the lifespan connects and disconnects the database.
        """
        with ExitStack() as stack:
            mock_middleware = stack.enter_context(
                patch('fastapi.FastAPI.add_middleware')
            )
            mock_mount = stack.enter_context(
                patch('fastapi.FastAPI.mount')
            )
            mock_router = stack.enter_context(
                patch('fastapi.FastAPI.include_router')
            )
            mock_exception_handler = stack.enter_context(
                patch('fastapi.FastAPI.add_exception_handler')
            )

            app = core.create_app()

        assert isinstance(app, fastapi.FastAPI)
        assert app.title == "Test Title"
        assert mock_middleware.called
        assert mock_mount.called
        assert mock_router.called
        assert mock_exception_handler.called

# ---------------------------------------------------------------------------- #


class TestLifespan(TestCase):
    """
    Test cases for the lifspan events.
    """

    def test_lifespan(self) -> None:
        """
        Test if the lifespan connects and disconnects the database.
        """
        with ExitStack() as stack:
            mock_connect = stack.enter_context(
                patch('app.database.Database.connect')
            )
            mock_disconnect = stack.enter_context(
                patch('app.database.Database.disconnect')
            )

            with self.client:
                response = self.client.get(
                    f"{self.api_version}/test/fake-route")

            assert mock_connect.called
            assert mock_disconnect.called
            assert response.status_code == fastapi.status.HTTP_404_NOT_FOUND

# ---------------------------------------------------------------------------- #


class TestExceptions(TestCase):
    """
    Test cases for exception handlers in the API.
    """

    async def test_exception_handler(self) -> None:
        """
        Test if the exception handler returns a valid JSON response.
        """
        response = await exception_handler(
            fastapi.Request(
                scope={"type": "http", "path": "/test", "headers": []}),
            Exception("Test exception")
        )

        assert isinstance(response, fastapi.responses.JSONResponse)
        assert response.status_code == fastapi.\
            status.HTTP_500_INTERNAL_SERVER_ERROR

    async def test_http_exception_handler(self) -> None:
        """
        Test if the http exception handler returns a valid JSON response.
        """
        response = await http_exception_handler(
            fastapi.Request(
                scope={"type": "http", "path": "/test", "headers": []}),
            HTTPException(
                status_code=fastapi.status.HTTP_404_NOT_FOUND,
                detail="Test HTTP exception"
            )
        )

        assert isinstance(response, fastapi.responses.JSONResponse)
        assert response.status_code == fastapi.status.HTTP_404_NOT_FOUND

        response = await http_exception_handler(
            fastapi.Request(
                scope={"type": "http", "path": "/test", "headers": []}),
            Exception(
                "Test HTTP exception"
            )
        )

        assert isinstance(response, fastapi.responses.JSONResponse)
        assert response.status_code == fastapi.status.\
            HTTP_500_INTERNAL_SERVER_ERROR

    def test_invalid_route(self) -> None:
        """
        Test that an invalid route returns a handled error.
        """
        response = self.client.get(f"/test/fake-route")

        assert response.status_code == fastapi.status.HTTP_404_NOT_FOUND
        assert "detail" in response.json()

# ---------------------------------------------------------------------------- #
