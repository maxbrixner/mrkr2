# ---------------------------------------------------------------------------- #

import requests
import logging
import time
import functools
import pathlib
import sqlmodel
import dotenv
from typing import Any, Callable, Dict, Optional, Self, List

# ---------------------------------------------------------------------------- #

import mrkr.schemas as schemas
import mrkr.models as models
import mrkr.database as database
import mrkr.crud as crud
from mrkr.services import ColonLevelFormatter

# ---------------------------------------------------------------------------- #


class MrkrClient():
    """
    MrkrClient is a client for the Mrkr API.
    """

    base_url: str
    port: int
    cert: str | tuple[str, str] | None
    proxies: dict | None
    timeout: float
    retry_attemps: int
    retry_delay: float
    _logger: logging.Logger

    def __init__(
        self,
        url: str = "http://localhost:8000",
        api_version: str = "v1",
        cert: str | tuple[str, str] | None = None,
        proxies: dict | None = None,
        timeout: float = 10.0,
        retry_attempts: int = 3,
        retry_delay: float = 1.0,
        log_level: str | int = logging.INFO
    ) -> None:
        """
        Initialize the MrkrClient.
        """
        self.base_url = f"{url.rstrip('/')}/api/{api_version}"
        self.cert = cert
        self.proxies = proxies
        self.timeout = timeout
        self.retry_attempts = retry_attempts
        self.retry_delay = retry_delay

        self._setup_logger(level=log_level)

    def __enter__(self) -> Self:
        """
        Enter the runtime context related to this object.
        """
        try:
            if self.get_health() != schemas.HealthEnum.healthy:
                raise Exception("API is not healthy")
        except:
            raise Exception(f"Failed to connect to the API @ {self.base_url}.")

        return self

    def __exit__(self, exc_type: Any, exc_value: Any, traceback: Any) -> None:
        """
        Exit the runtime context related to this object.
        """
        pass

    def _setup_logger(self, level: str | int = logging.INFO) -> None:
        """
        Set up logging configuration.
        """
        self._logger = logging.getLogger("mrkr.sdk.client")
        self._logger.setLevel(level=level)
        handler = logging.StreamHandler()
        handler.setLevel(level=level)
        formatter = ColonLevelFormatter(
            "\u001B[35m%(levelname)-9s\u001B[0m %(message)s")
        handler.setFormatter(formatter)
        self._logger.addHandler(handler)

    @staticmethod
    def _retry(func: Callable) -> Callable:
        """
        Decorator to retry method calls (e.g. API calls) in case of failure.
        """
        @functools.wraps(func)
        def wrapper(self: Self, *args: Any, **kwargs: Any) -> Any:
            attempt = 0
            last_exception = None
            while attempt < self.retry_attempts:
                try:
                    return func(self, *args, **kwargs)
                except Exception as exception:
                    self._logger.warning(
                        f"Attempt {attempt + 1} failed.")
                    attempt += 1
                    time.sleep(self.retry_delay)
                    last_exception = exception

            if last_exception:
                self._logger.error(
                    f"Failed after {self.retry_attempts} attempts.")
                raise last_exception
        return wrapper

    @_retry
    def _call_api(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict] = None,
        json: Optional[Dict] = None
    ) -> requests.Response:
        """
        Query the API.
        """
        url = f"{self.base_url}/{endpoint.lstrip('/')}"

        self._logger.debug(
            f"Calling API: {method.upper()} {url}"
            if params is None else
            f"{method.upper()} {url} with params {params}"
        )

        match method.lower():
            case "get":
                response = requests.get(
                    url=url,
                    params=params,
                    cert=self.cert,
                    proxies=self.proxies,
                    timeout=self.timeout
                )
            case "post":
                response = requests.post(
                    url=url,
                    params=params,
                    json=json,
                    cert=self.cert,
                    proxies=self.proxies,
                    timeout=self.timeout
                )
            case "put":
                response = requests.put(
                    url=url,
                    params=params,
                    json=json,
                    cert=self.cert,
                    proxies=self.proxies,
                    timeout=self.timeout
                )
            case _:
                raise ValueError(f"Unsupported HTTP method: {method}")

        if response.status_code == 200:
            self._logger.debug(
                f"API responded successfully.")
            return response
        else:
            raise Exception(
                f"Failed to query {url}. "
                f"Response status: {response.status_code}. "
                f"Response content: {response.text}")

    def get_health(self) -> schemas.HealthEnum:
        """
        Check the health of the API.
        """
        response = self._call_api(method="GET", endpoint="/utils/health")
        schema = schemas.HealthSchema.model_validate(response.json())
        return schema.health

    def create_project(
        self,
        name: str,
        config: Dict | schemas.ProjectConfigSchema
    ) -> int | None:
        """
        Create a new project. Returns the project ID.
        """
        if isinstance(config, dict):
            config = schemas.ProjectConfigSchema(**config)

        project = schemas.ProjectCreateSchema(
            name=name,
            config=config
        )

        response = self._call_api(
            method="POST",
            endpoint="/project",
            json=project.model_dump()
        )

        return response.json().get("project_id", None)

    def scan_project(
        self,
        project_id: int
    ) -> None:
        """
        Scan a project, i.e. ask the file provider to scan the files
        associated with the project and update the database.
        """
        self._call_api(
            method="POST",
            endpoint=f"/project/{project_id}/scan"
        )

    def update_project_name(
        self,
        project_id: int,
        name: schemas.UpdateProjectNameSchema | str
    ) -> None:
        """
        Update the name of a project.
        """
        if isinstance(name, str):
            name = schemas.UpdateProjectNameSchema(name=name)

        self._call_api(
            method="PUT",
            endpoint=f"/project/{project_id}/name",
            json=name.model_dump()
        )

    def update_project_configuration(
        self,
        project_id: int,
        config: schemas.ProjectConfigSchema | Dict
    ) -> None:
        """
        Update the configuration of a project.
        """
        if isinstance(config, dict):
            config = schemas.ProjectConfigSchema(**config)

        self._call_api(
            method="PUT",
            endpoint=f"/project/{project_id}/config",
            json=config.model_dump()
        )

    def list_projects(
        self
    ) -> List[schemas.ProjectListSchema]:
        """
        List all projects.
        """
        response = self._call_api(
            method="GET",
            endpoint="/project/list-projects"
        )
        return [schemas.ProjectListSchema.model_validate(item)
                for item in response.json()]

    def list_project_documents(
        self,
        project_id: int
    ) -> List[schemas.DocumentListSchema]:
        """
        List all documents for a given project.
        """
        response = self._call_api(
            method="GET",
            endpoint=f"/project/{project_id}/list-documents"
        )
        return [schemas.DocumentListSchema.model_validate(item)
                for item in response.json()]

    def get_project(
        self,
        project_id: int
    ) -> schemas.ProjectSchema:
        """
        Get a project (including its configuration) by its ID.
        """
        response = self._call_api(
            method="GET",
            endpoint=f"/project/{project_id}"
        )

        return schemas.ProjectSchema(**response.json())

    def get_document(
        self,
        document_id: int
    ) -> schemas.DocumentSchema:
        """
        Get a document (including its label data) by its ID.
        """
        response = self._call_api(
            method="GET",
            endpoint=f"/document/{document_id}"
        )

        return schemas.DocumentSchema(**response.json())

    def create_user(
        self,
        user: Dict | schemas.UserCreateSchema
    ) -> int | None:
        """
        Create a new user.
        """
        if isinstance(user, dict):
            user = schemas.UserCreateSchema(**user)

        response = self._call_api(
            method="POST",
            endpoint="/user",
            json=user.model_dump()
        )

        return response.json().get("user_id", None)

    def list_users(
        self
    ) -> List[schemas.UserListSchema]:
        """
        List all users.
        """
        response = self._call_api(
            method="GET",
            endpoint="/user/list-users"
        )

        return [schemas.UserListSchema.model_validate(item)
                for item in response.json()]


# ---------------------------------------------------------------------------- #


class MrkrDatabaseClient():
    """
    MrkrDatabaseClient is a client for the Mrkr database.
    """
    _database: database.Database
    _session: sqlmodel.Session | None
    _logger: logging.Logger

    def __init__(
        self,
        env_file: Optional[pathlib.Path | str] = None
    ) -> None:
        """
        Initialize the MrkrDatabaseClient.
        """
        self._session = None

        self._setup_logger()
        self._load_env_file(env_file=env_file)

    def __enter__(self) -> Self:
        """
        Enter the runtime context related to this object.
        """
        self._connect()

        return self

    def __exit__(self, exc_type: Any, exc_value: Any, traceback: Any) -> None:
        """
        Exit the runtime context related to this object.
        """
        try:
            if self._session:
                self._session.close()
            if self._database:
                self._database.disconnect()
        except Exception as exception:
            self._logger.error(f"Error occurred during cleanup: {exception}")

    def _setup_logger(self, level: str | int = logging.INFO) -> None:
        """
        Set up logging configuration.
        """
        self._logger = logging.getLogger("mrkr.sdk.client")
        self._logger.setLevel(level=level)
        handler = logging.StreamHandler()
        handler.setLevel(level=level)
        formatter = ColonLevelFormatter(
            "\u001B[35m%(levelname)-9s\u001B[0m %(message)s")
        handler.setFormatter(formatter)
        self._logger.addHandler(handler)

    def _load_env_file(
        self,
        env_file: Optional[pathlib.Path | str] = None
    ) -> None:
        """
        Load environment variables from a .env file.
        """
        if not env_file:
            return

        if isinstance(env_file, str):
            env_file = pathlib.Path(env_file)

        if env_file.exists():
            dotenv.load_dotenv(dotenv_path=env_file)
        else:
            raise FileNotFoundError(
                f"Environment file '{env_file}' does not exist.")

    def _connect(self) -> None:
        """
        Connect to the database.
        """
        try:
            self._database = database.get_database()
            self._database.connect()

            self._session = next(self._database.get_session())
            if self._session is None:
                raise Exception("Failed to connect to the database.")
        except Exception as exception:
            self._logger.error(
                f"Failed to connect to the database: {exception}")

    def list_projects(
        self
    ) -> List[schemas.ProjectListSchema]:
        """
        List all projects.
        """
        if not self._session:
            raise Exception("Database session is not initialized.")

        db_projects = crud.get_projects(session=self._session)

        return [schemas.ProjectListSchema(**project.model_dump())
                for project in db_projects]

    def get_project(
        self,
        project_id: int
    ) -> schemas.ProjectSchema:
        """
        Get a project (including its configuration) by its ID.
        """
        if not self._session:
            raise Exception("Database session is not initialized.")

        db_project = crud.get_project(
            session=self._session,
            id=project_id
        )

        if not db_project:
            raise Exception(f"Project {project_id} not found.")

        return schemas.ProjectSchema(**db_project.model_dump())

    def list_project_documents(
        self,
        project_id: int
    ) -> List[schemas.DocumentListSchema]:
        """
        List all documents for a given project.
        """
        if not self._session:
            raise Exception("Database session is not initialized.")

        db_documents = crud.get_project_documents(
            session=self._session,
            project_id=project_id
        )

        return [schemas.DocumentListSchema(**doc.model_dump())
                for doc in db_documents]

    def get_document(
        self,
        document_id: int
    ) -> schemas.DocumentSchema:
        """
        Get a document (including its label data) by its ID.
        """
        if not self._session:
            raise Exception("Database session is not initialized.")

        db_document = crud.get_document(
            session=self._session,
            id=document_id
        )

        if not db_document:
            raise Exception(f"Document {document_id} not found.")

        return schemas.DocumentSchema(**db_document.model_dump())

# ---------------------------------------------------------------------------- #
