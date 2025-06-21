# ---------------------------------------------------------------------------- #

import requests
import logging
from typing import Any, Dict, Optional, Self

# ---------------------------------------------------------------------------- #

import mrkr.schemas as schemas

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

    def __init__(
        self,
        url: str = "http://localhost:8000",
        api_version: str = "v1",
        cert: str | tuple[str, str] | None = None,
        proxies: dict | None = None,
        timeout: float = 10.0,
        log_level: str | int = logging.INFO
    ) -> None:
        """
        Initialize the MrkrClient.
        """
        self.base_url = f"{url.rstrip("/")}/api/{api_version}"
        self.cert = cert
        self.proxies = proxies
        self.timeout = timeout

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
        formatter = logging.Formatter(
            "\u001B[36m[MRKR | %(levelname)-8s | %(name)-30s]"
            "\u001B[0m %(message)s")
        handler.setFormatter(formatter)
        self._logger.addHandler(handler)

    def _call_api(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict] = None,
        json: Optional[Dict] = None,
    ) -> requests.Response:
        """
        Query the API with a GET request.
        """
        url = f"{self.base_url}/{endpoint.lstrip("/")}"

        self._logger.debug(
            f"Calling API: {method.upper()} {url} with params: {params}.")

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
            case _:
                raise ValueError(f"Unsupported HTTP method: {method}")

        if response.status_code == 200:
            self._logger.debug(
                f"API response: {response.status_code} - {response.text}")
            return response
        else:
            self._logger.error(
                f"API call failed: {response.status_code} - {response.text}")
            raise Exception(
                f"Failed to query {url}. "
                f"Response status: {response.status_code}. "
                f"Response content: {response.text}")

    def get_health(self) -> str:
        """
        Check the health of the API.
        """
        response = self._call_api(method="GET", endpoint="/utils/health")
        schema = schemas.HealthSchema.model_validate(response.json())
        return schema.health

    def create_project(
        self,
        name: str,
        config: schemas.ProjectSchema
    ) -> int | None:
        """
        Create a new project. Returns the project ID.
        """
        project = schemas.ProjectCreateSchema(
            name=name,
            config=config
        )

        response = self._call_api(
            method="POST",
            endpoint="/project/create",
            json=project.model_dump()
        )

        return response.json().get("project_id", None)

    def scan_project(
        self,
        project_id: int
    ) -> None:
        """
        Scan a project.
        """
        self._call_api(
            method="POST",
            endpoint=f"/project/scan/{project_id}"
        )

    def schedule_ocr(
        self,
        project_id: int
    ) -> None:
        """
        Schedule an OCR run for a project.
        """
        self._call_api(
            method="POST",
            endpoint=f"/ocr/run/{project_id}"
        )

# ---------------------------------------------------------------------------- #
