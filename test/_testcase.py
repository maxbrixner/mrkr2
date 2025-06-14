# ---------------------------------------------------------------------------- #

import unittest
import sqlmodel
import sqlmodel.pool
import sqlalchemy
from fastapi import FastAPI
from fastapi.testclient import TestClient
from unittest.mock import patch
from typing import Generator

# ---------------------------------------------------------------------------- #

import app.core as core
import app.database as database
import app.services as services
from app.services.config import _BackendSchema, _CorsSchema, _DatabaseSchema, \
    _ProjectSchema, _StaticFilesSchema, _TemplatesSchema, _GzipSchema

# ---------------------------------------------------------------------------- #


def create_test_configuration() -> services.ConfigSchema:
    """
    Create a test configuration with default values for testing purposes.
    This function initializes a ConfigSchema instance with predefined
    values.
    """
    return services.ConfigSchema(
        backend=_BackendSchema(),
        cors=_CorsSchema(),
        database=_DatabaseSchema(
            url="sqlite://",
        ),
        gzip=_GzipSchema(
            enabled=True
        ),
        project=_ProjectSchema(
            author="Test Author",
            description="Test Description",
            title="Test Title",
            version="1.0.0"
        ),
        static_files=_StaticFilesSchema(
            enabled=True,
            headers={"Cache-Control": "no-cache"},
            directory=".",
        ),
        templates=_TemplatesSchema(
            enabled=True,
            headers={"Cache-Control": "no-cache"}
        )
    )

# ---------------------------------------------------------------------------- #


class TestCase(unittest.IsolatedAsyncioTestCase):
    """
    Base test case class for setting up a FastAPI test client and an
    in-memory SQLite database for testing. This class provides setup and
    teardown methods to ensure a clean state for each test.
    """
    app: FastAPI
    client: TestClient
    engine: sqlalchemy.engine.base.Engine
    session: sqlmodel.Session
    api_version: str

    config: services.ConfigSchema

    patch_config: unittest.mock._patch
    patch_logger: unittest.mock._patch
    mock_config: unittest.mock._patch
    mock_logger: unittest.mock._patch

    @classmethod
    def setUpClass(cls) -> None:
        """
        Set up the test case by creating a FastAPI test client and initializing
        an in-memory SQLite database for testing. This runs once before all
        tests. During this setup, the configuration and logger are mocked
        to avoid external dependencies and ensure a controlled environment.
        """
        # Patch configuration
        cls.config = create_test_configuration()
        cls.patch_config = patch('app.services.get_configuration')
        cls.mock_config = cls.patch_config.start()
        cls.mock_config.return_value = cls.config

        # Patch logger
        cls.patch_logger = patch('app.services.setup_logger')
        cls.mock_logger = cls.patch_logger.start()

        # Create a FastAPI application instance
        cls.app = core.create_app()

        # Create a test client for the FastAPI application
        cls.client = TestClient(cls.app)

        # Initialize an in-memory SQLite database for testing
        cls.engine = sqlmodel.create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=sqlmodel.pool.StaticPool,
        )

        # Set the API version to an empty string (should be set in tests)
        cls.api_version = ""

    def setUp(self) -> None:
        """
        Set up the test case by initializing the SQLite database for testing.
        This runs before each test to ensure a clean state.
        """
        # Initialize the database schema
        sqlmodel.SQLModel.metadata.drop_all(self.engine)
        sqlmodel.SQLModel.metadata.create_all(self.engine)

        # Create a new session for testing
        self.session = sqlmodel.Session(self.engine)

        # Override the database session and configuration dependencies
        def get_session_override() -> Generator[sqlmodel.Session]:
            yield self.session

        def get_config_override() -> services.ConfigSchema:
            return self.config

        self.app.dependency_overrides[
            database.get_database_session
        ] = get_session_override

        self.app.dependency_overrides[
            services.get_configuration
        ] = get_config_override

    def tearDown(self) -> None:
        """
        Clean up the test case by closing the session and removing the
        dependency override after each test.
        """
        self.session.close()
        self.app.dependency_overrides.pop(database.get_database_session, None)
        self.app.dependency_overrides.pop(services.get_configuration, None)

    @classmethod
    def tearDownClass(cls) -> None:
        """
        Clean up the test case by stopping the patcher for configuration
        and logger after all tests have run.
        """
        cls.patch_config.stop()
        cls.patch_logger.stop()

# ---------------------------------------------------------------------------- #
