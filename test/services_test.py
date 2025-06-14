# ---------------------------------------------------------------------------- #

import unittest
import os
import pathlib
import tempfile
from fastapi import Request, Response
from fastapi.templating import Jinja2Templates
from unittest.mock import patch
from contextlib import ExitStack

# ---------------------------------------------------------------------------- #

import app.services as services
from test._testcase import TestCase

# ---------------------------------------------------------------------------- #


class ConfigTest(TestCase):
    """
    Test cases for service operations.
    """

    def test_get_configuration(self) -> None:
        """
        Test case for loading the configuration.
        """
        self.patch_config.stop()
        services.get_configuration.cache_clear()
        with ExitStack() as stack:
            stack.enter_context(
                patch.dict(os.environ, {"CONFIG": "test.json"})
            )
            mock_file = stack.enter_context(
                patch("pathlib.Path.open", unittest.mock.mock_open(
                    read_data=self.config.model_dump_json()))
            )

            config = services.get_configuration()
            assert config.project.title == "Test Title"
            mock_file.assert_called_once()
            assert isinstance(config, services.ConfigSchema)

        self.patch_config.start()

# ---------------------------------------------------------------------------- #


class LoggingTest(TestCase):
    """
    Test cases for logging operations.
    """

    def test_setup_logger(self) -> None:
        """
        Test case for loading the logger configuration.
        """
        self.patch_logger.stop()
        with ExitStack() as stack:
            stack.enter_context(
                patch.dict(os.environ, {"LOGGING": "test.json"})
            )
            mock_file = stack.enter_context(
                patch("pathlib.Path.open", unittest.mock.mock_open(
                    read_data='{"version": 1}'))
            )
            mock_logger = stack.enter_context(
                patch("logging.config.dictConfig")
            )

            services.setup_logger()
            mock_file.assert_called_once()
            mock_logger.assert_called_once()

        self.patch_logger.start()

# ---------------------------------------------------------------------------- #


class TemplatesTest(TestCase):
    """
    Test cases for template operations via Jinja2.
    """

    def test_get_templates(self) -> None:
        """
        Test case for loading the Jinja2 templates.
        """
        templates = services.get_templates()
        assert isinstance(templates, Jinja2Templates)

    def test_middleware_init(self) -> None:
        """
        Test case for initializing the TemplateHeaderMiddleware.
        """
        middleware = services.TemplateHeaderMiddleware(self.app)
        assert isinstance(middleware, services.TemplateHeaderMiddleware)
        assert middleware._custom_headers == self.config.templates.headers
        assert middleware._swagger_path == self.config.project.swagger_path

    async def _create_mock_request(self, path: str = "/", content_type: str = "text/html") -> Request:
        """
        Helper to create a mock Request object.
        """
        scope = {
            "type": "http",
            "asgi": {"version": "3.0"},
            "method": "GET",
            "path": path,
            "headers": [(b"content-type", content_type.encode())] if content_type else []
        }
        mock_receive = unittest.mock.AsyncMock()
        mock_send = unittest.mock.AsyncMock()
        return Request(scope, mock_receive, mock_send)

    async def test_middleware_dispatch(self) -> None:
        """
        Test case for dispatching a request through the TemplateHeaderMiddleware.
        """
        middleware = services.TemplateHeaderMiddleware(self.app)

        initial_response = Response(
            "<html>Hello</html>", media_type="text/html", status_code=200)
        mock_call_next = unittest.mock.AsyncMock(return_value=initial_response)

        response = await middleware.dispatch(
            request=await self._create_mock_request(),
            call_next=mock_call_next
        )

        assert response.status_code == 200
        # as defined in the test configuration
        assert response.headers.get("Cache-Control") == "no-cache"

    async def test_middleware_dispatch_existing_header(self) -> None:
        """
        Test case for dispatching a request through the
        TemplateHeaderMiddleware when the response already has a Cache-Control
        header.
        """
        middleware = services.TemplateHeaderMiddleware(self.app)
        initial_response = Response(
            "<html>Hello</html>", media_type="text/html", status_code=200,
            headers={"Cache-Control": "no-store"})
        mock_call_next = unittest.mock.AsyncMock(return_value=initial_response)

        response = await middleware.dispatch(
            request=await self._create_mock_request(),
            call_next=mock_call_next
        )

        assert response.status_code == 200
        assert response.headers.get("Cache-Control") == "no-store"

# ---------------------------------------------------------------------------- #


class StaticTest(TestCase):
    def test_static_files_with_headers_initialization(self) -> None:
        """
        Test case for the StaticFilesWithHeaders class.
        """
        static_files = services.StaticFilesWithHeaders(directory=".")
        assert isinstance(static_files, services.StaticFilesWithHeaders)
        assert static_files._custom_headers == self.config.static_files.headers

    async def test_static_files_with_headers_get_response(self) -> None:
        """
        Test case for the get_response method of StaticFilesWithHeaders.
        """
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_file.write(b"<html>Test</html>")
            temp_file_path = temp_file.name
            temp_file_dir = pathlib.Path(temp_file_path).parent
            with patch("pathlib.Path.open", unittest.mock.mock_open(
                    read_data="test content")):
                static_files = services.StaticFilesWithHeaders(
                    directory=temp_file_dir)
                mock_scope = {"method": "GET", "type": "http",
                              "path": temp_file_path, "headers": []}
                response = await static_files.get_response(
                    temp_file_path, mock_scope)

        assert isinstance(response, Response)
        assert response.status_code == 200
        # as defined in the test configuration
        assert response.headers.get("Cache-Control") == "no-cache"

# ---------------------------------------------------------------------------- #
