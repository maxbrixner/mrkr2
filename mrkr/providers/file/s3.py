# ---------------------------------------------------------------------------- #

import pathlib
import logging
import asyncio
import io
from typing import AsyncGenerator, Optional

# ---------------------------------------------------------------------------- #

import mrkr.schemas as schemas
from .base import BaseFileProvider
from ..aws import AwsSession, AsyncBucketWrapper

# ---------------------------------------------------------------------------- #

logger = logging.getLogger("mrkr.providers.file")

# ---------------------------------------------------------------------------- #


class S3FileProvider(BaseFileProvider):
    """
    A provider that handles AWS S3 file operations.
    """
    _config: schemas.FileProviderS3ConfigSchema
    _session: AwsSession | None
    _bucket: AsyncBucketWrapper | None

    def __init__(self, config: schemas.FileProviderS3ConfigSchema):
        super().__init__(config=config)

        aws_config = schemas.AwsConfigSchema(**self._config.model_dump())

        self._session = None
        self._bucket = None

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
        await self.refresh_bucket()
        if self._bucket is None:
            raise Exception("Bucket not initialized.")

        return await self._bucket.is_file(key=str(self.filename))

    @property
    async def is_folder(self) -> bool:
        """
        Returns True if the path is a folder, False otherwise.
        """
        await self.refresh_bucket()
        if self._bucket is None:
            raise Exception("Bucket not initialized.")

        return await self._bucket.is_folder(key=str(self.filename))

    async def read(
        self,
        chunk_size: Optional[int] = None
    ) -> AsyncGenerator[bytes, None]:
        """
        Asynchronously yields the file content in chunks.
        """
        logger.debug(f"Streaming file content for: '{self.filename}'")

        await self.refresh_bucket()
        if self._bucket is None:
            raise Exception("Bucket not initialized.")

        if not await self.is_file:
            raise Exception(f"Object '{self.filename}' is not a file.")

        loop = asyncio.get_running_loop()

        try:
            stream = io.BytesIO()
            await self._bucket.download_fileobj(
                key=str(self.filename),
                stream=stream
            )

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
        except Exception as exception:
            raise exception
        finally:
            stream.close()

    async def list(self) -> AsyncGenerator[str, None]:
        """
        Lists the contents of the directory if the path is a folder.
        """
        logger.debug(f"Listing files for path: '{self.filename}'")

        await self.refresh_bucket()
        if self._bucket is None:
            raise Exception("Bucket not initialized.")

        if not await self.is_folder:
            raise Exception(f"Object '{self.filename}' is not a folder.")

        async for object in self._bucket.list_objects(prefix=str(self.filename)):
            if object.key.endswith("/"):
                continue

            filename = pathlib.Path(object.key).name
            yield filename

    async def refresh_bucket(self) -> None:
        """
        Refresh the S3 bucket if needed.
        """
        if self._session is None:
            aws_config = schemas.AwsConfigSchema(**self._config.model_dump())
            self._session = AwsSession(config=aws_config)

        if self._bucket is None:
            self._bucket = await self._session.get_async_bucket(
                bucket_name=self._config.aws_bucket_name)


# ---------------------------------------------------------------------------- #
