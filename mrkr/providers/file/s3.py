# ---------------------------------------------------------------------------- #

import pathlib
import logging
import asyncio
import boto3
from typing import Any, AsyncGenerator, Self, Optional

# ---------------------------------------------------------------------------- #

import mrkr.schemas as schemas
from .base import BaseFileProvider
from ..aws import AwsSession

# ---------------------------------------------------------------------------- #

logger = logging.getLogger("mrkr.providers.file")

# ---------------------------------------------------------------------------- #


class S3FileProvider(BaseFileProvider):
    """
    A provider that handles AWS S3 file operations.
    """
    _config: schemas.FileProviderS3ConfigSchema
    _bucket: Any

    def __init__(self, config: schemas.FileProviderS3ConfigSchema):
        super().__init__(config=config)

        aws_config = schemas.AwsConfigSchema(**self._config.model_dump())

        session = AwsSession(config=aws_config)
        self._bucket = session.get_bucket(
            bucket_name=self._config.aws_bucket_name)

    @property
    def filename(self) -> pathlib.Path:
        """
        Returns the full path of the file or folder.
        """
        return pathlib.Path(
            self._config.path.strip("/")
        ) / pathlib.Path(self.path.strip("/"))

    @property
    async def is_file(self) -> bool:
        """
        Returns True if the path is a file, False otherwise.
        """
        loop = asyncio.get_running_loop()
        is_file = await loop.run_in_executor(
            None, self.filename.is_file)
        return is_file

    @property
    async def is_folder(self) -> bool:
        """
        Returns True if the path is a folder, False otherwise.
        """
        return True
        # loop = asyncio.get_running_loop()
        # is_folder = await loop.run_in_executor(
        #    None, self.filename.is_dir)
        # return is_folder

    async def read(
        self,
        chunk_size: Optional[int] = None
    ) -> AsyncGenerator[bytes, None]:
        """
        Asynchronously yields the file content in chunks.
        """
        logger.debug(f"Streaming file content for: '{self.filename}'")

        if not await self.is_file:
            raise Exception(f"Object '{self.filename}' is not a file.")

        loop = asyncio.get_running_loop()

        stream = await loop.run_in_executor(
            None, self.filename.open, 'rb')

        while True:
            if chunk_size:
                chunk = await loop.run_in_executor(
                    None, stream.read, chunk_size)
            else:
                chunk = await loop.run_in_executor(
                    None, stream.read)
            if not chunk:
                break
            yield chunk

    async def list(self) -> AsyncGenerator[str, None]:
        """
        Lists the contents of the directory if the path is a folder.
        """
        logger.debug(f"Listing files for path: '{self.filename}'")

        if not await self.is_folder:
            raise Exception(f"Object '{self.filename}' is not a folder.")

        for object in self._bucket.objects.filter(Prefix=str(self.filename)):
            if object.key.endswith("/"):
                continue

            filename = pathlib.Path(object.key).name
            yield filename

# ---------------------------------------------------------------------------- #
