# ---------------------------------------------------------------------------- #

import sqlalchemy
import sqlmodel
import logging
import re
import os
from typing import Generator
from functools import lru_cache

# ---------------------------------------------------------------------------- #

import app.services as services

# ---------------------------------------------------------------------------- #

logger = logging.getLogger("app.database")

# ---------------------------------------------------------------------------- #


class Database():
    """
    Simple class for managing database connections using sqlmodel.
    """
    _engine: sqlalchemy.engine.base.Engine | None
    _config: services.ConfigSchema

    def __init__(self) -> None:
        """
        Initialize the Database class.
        """
        self._engine = None
        self._config = services.get_configuration()

        logger.info("Database initialized.")

    def connect(self) -> None:
        """
        Connect to the database. This method creates a new database engine
        and initializes the database schema. The  database URL is obtained
        from the configuration. The URL may contain environment variable
        placeholders in the format {{VAR_NAME}} where VAR_NAME is the name
        of the environment variable to be replaced with its value.
        """
        self._engine = sqlmodel.create_engine(
            url=self._resolve_url(url=self._config.database.url),
            echo=self._config.database.echo,
            pool_size=self._config.database.pool_size,
            max_overflow=self._config.database.max_overflow)
        sqlmodel.SQLModel.metadata.create_all(self._engine)
        logger.info("Database connection established.")

    def disconnect(self) -> None:
        """
        Disconnect from the database. This method disposes of the database
        engine and closes all connections.
        """
        if self._engine:
            self._engine.dispose()
        self._engine = None
        logger.info("Database connection disposed.")

    def get_session(self) -> Generator[sqlmodel.Session]:
        """
        Get a session from the database engine.
        """
        if self._engine is None:
            raise Exception("Database engine is not initialized.")

        with sqlmodel.Session(self._engine) as session:
            logger.debug("Database session created.")
            yield session

        logger.debug("Database session closed.")

    def _resolve_url(self, url: str) -> str:
        """
        Get the database URL from the configuration. Replace any
        environment variable placeholders in the URL with their values.
        If an environment variable is not set, raise an exception. Placeholders
        are in the format {{VAR_NAME}} where VAR_NAME is the name of the
        environment variable to be replaced.
        """
        def replace_env_var(match: re.Match) -> str:
            """
            Replace environment variable placeholders in the URL.
            """
            name = match.group(1)
            value = os.getenv(name, default=None)
            if value is None:
                raise Exception(f"Environment variable '{name}' not set. "
                                f"The database URL cannot be constructed.")
            return value

        url = re.sub(r"{{(\w+)}}", replace_env_var, url)
        return url

# ---------------------------------------------------------------------------- #


@lru_cache
def get_database() -> Database:
    """
    Get an instance of the Database class. his function is used to create a
    singleton instance of the Database class.
    """
    return Database()

# ---------------------------------------------------------------------------- #


def get_database_session() -> Generator[sqlmodel.Session]:
    """
    Get a database session from the Database class. This function is used to
    create a new session for each request.
    """
    database = get_database()
    logger.debug("Yielding database session for request.")
    yield from database.get_session()


# ---------------------------------------------------------------------------- #
