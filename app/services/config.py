# ---------------------------------------------------------------------------- #

import logging
import pydantic
import pathlib
import os
import json
from typing import Any, Dict, List, Optional, Union
from functools import lru_cache

# ---------------------------------------------------------------------------- #

logger = logging.getLogger("app.services")

# ---------------------------------------------------------------------------- #


class _DatabaseSchema(pydantic.BaseModel):
    echo: bool = False
    max_overflow: int = 10
    pool_size: int = 5
    url: str


class _ProjectSchema(pydantic.BaseModel):
    author: str
    description: str
    summary: Optional[str] = None
    terms_of_service: Optional[str] = None
    title: str
    version: str
    swagger_path: Optional[str] = "/docs"


class _BackendSchema(pydantic.BaseModel):
    host: str = "0.0.0.0"
    port: int = 8000
    root_path: str = ""


class _CorsSchema(pydantic.BaseModel):
    allow_credentials: bool = False
    allow_headers: List[str] = []
    allow_methods: List[str] = []
    allow_origins: List[str] = []
    enabled: bool = True
    expose_headers: List[str] = []
    max_age: Optional[int] = 600


class _StaticFilesSchema(pydantic.BaseModel):
    directory: str = "static"
    enabled: bool = False
    headers: Dict[str, str] = {}
    name: str = "static"
    path: str = "/static"


class _TemplatesSchema(pydantic.BaseModel):
    directory: str = "templates"
    enabled: bool = False
    headers: Dict[str, str] = {}


class _GzipSchema(pydantic.BaseModel):
    compression_level: int = 5
    enabled: bool = False
    minimum_size: int = 1000


class ConfigSchema(pydantic.BaseModel):
    backend: _BackendSchema = _BackendSchema()
    cors: _CorsSchema = _CorsSchema()
    database: _DatabaseSchema
    gzip: _GzipSchema = _GzipSchema()
    project: _ProjectSchema
    static_files: _StaticFilesSchema = _StaticFilesSchema()
    templates: _TemplatesSchema = _TemplatesSchema()

# ---------------------------------------------------------------------------- #


@lru_cache
def get_configuration() -> ConfigSchema:
    """
    Load the configuration file from the config directory. The filename
    is specified in the CONFIG environment variable. We do not use
    pydantic's BaseSettings here because we want to load the configuration
    from a file rather than environment variables.
    """
    filename = os.getenv("CONFIG")

    if not filename:
        raise Exception("CONFIG environment variable not set.")

    config_file = pathlib.Path(__file__).parent.parent / \
        pathlib.Path("config") / \
        pathlib.Path(filename)

    with config_file.open("r") as file:
        content = json.load(file)
        config = ConfigSchema(**content)

    logger.info(f"Application configuration loaded.")

    return config

# ---------------------------------------------------------------------------- #
