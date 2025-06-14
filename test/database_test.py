# ---------------------------------------------------------------------------- #

import sqlmodel
import sqlalchemy
import os
from unittest.mock import patch
from typing import Generator

# ---------------------------------------------------------------------------- #

import app.database as database
from test._testcase import TestCase

# ---------------------------------------------------------------------------- #


class DatabaseTest(TestCase):
    """
    Test cases for database operations in the API.
    """

    def test_initialize(self) -> None:
        """
        Test case for initializing the database without an engine.
        """
        database.get_database.cache_clear()
        database_instance = database.get_database()

        # at this point, the engine should not be initialized
        assert database_instance._engine is None
        assert isinstance(database_instance, database.Database)

    def test_connect(self) -> None:
        """
        Test case for connecting to the database.
        """
        database.get_database.cache_clear()
        with patch(
            "app.database.database.sqlmodel.create_engine",
            return_value=sqlalchemy.create_engine(
                "sqlite://",
                connect_args={"check_same_thread": False},
                poolclass=sqlmodel.pool.StaticPool,
            )
        ) as mock_create_engine:
            database_instance = database.get_database()
            database_instance.connect()

            assert database_instance._engine is not None
            assert isinstance(database_instance._engine,
                              sqlalchemy.engine.base.Engine)
            mock_create_engine.assert_called_once()

            database_instance.disconnect()

    def test_disconnect(self) -> None:
        """
        Test case for disconnecting from the database.
        """
        database.get_database.cache_clear()
        with patch(
            "app.database.database.sqlmodel.create_engine",
            return_value=sqlalchemy.create_engine(
                "sqlite://",
                connect_args={"check_same_thread": False},
                poolclass=sqlmodel.pool.StaticPool,
            )
        ):
            database_instance = database.get_database()
            database_instance.connect()
            database_instance.disconnect()

        assert database_instance._engine is None

    def test_get_session(self) -> None:
        """
        Test case for getting a database session.
        """
        database.get_database.cache_clear()
        with patch(
            "app.database.database.sqlmodel.create_engine",
            return_value=sqlalchemy.create_engine(
                "sqlite://",
                connect_args={"check_same_thread": False},
                poolclass=sqlmodel.pool.StaticPool,
            )
        ):
            database_instance = database.get_database()
            database_instance.connect()

            session = database_instance.get_session()

            assert isinstance(session, Generator)
            assert isinstance(session.__next__(), sqlmodel.Session)

            database_instance.disconnect()

    def test_get_database_url(self) -> None:
        """
        Test case for getting the database URL.
        """
        database.get_database.cache_clear()
        with patch.dict(os.environ, {"VAR1": "test", "VAR2": "db"}):
            database_instance = database.get_database()

            url = database_instance._resolve_url(
                url="sqlite:///{{VAR1}}:{{VAR2}}.db")
            assert url == "sqlite:///test:db.db"

            with self.assertRaises(Exception):
                url = database_instance._resolve_url(
                    url="sqlite:///{{VAR1}}:{{VAR3}}.db"
                )

            database_instance.disconnect()


# ---------------------------------------------------------------------------- #
