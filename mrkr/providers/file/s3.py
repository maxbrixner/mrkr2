# ---------------------------------------------------------------------------- #

import pathlib
import logging
import asyncio
import io
import pydantic
import functools
from typing import Any, AsyncGenerator, Optional

# ---------------------------------------------------------------------------- #

import mrkr.schemas as schemas
from .base import BaseFileProvider
from ..aws import AwsSession

# ---------------------------------------------------------------------------- #

logger = logging.getLogger("mrkr.providers.file")

# ---------------------------------------------------------------------------- #


class BucketObjectMetadata(pydantic.BaseModel):
    content_type: str = pydantic.Field(alias="ContentType")
    etag: str = pydantic.Field(alias="ETag")

# ---------------------------------------------------------------------------- #


class S3FileProvider(BaseFileProvider):
    """
    A provider that handles AWS S3 file operations.
    """
    _config: schemas.FileProviderS3ConfigSchema
    _session: AwsSession | None
    _bucket: Any | None

    def __init__(self, config: schemas.FileProviderS3ConfigSchema):
        super().__init__(config=config)

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

        key = str(self.filename)

        metadata = await self._get_object_metadata(key=key)

        if not metadata:
            return False

        if not metadata.content_type.lower().startswith(
                "application/x-directory"):
            return True

        return False

    @property
    async def is_folder(self) -> bool:
        """
        Returns True if the path is a folder, False otherwise.
        """
        await self.refresh_bucket()
        if self._bucket is None:
            raise Exception("Bucket not initialized.")

        key = str(self.filename).rstrip("/") + "/"

        metadata = await self._get_object_metadata(key=key)

        if not metadata:
            return False

        if metadata.content_type.lower().startswith(
                "application/x-directory"):
            return True

        return False

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
            await self._download_fileobj(
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

        loop = asyncio.get_running_loop()

        key = str(self.filename).rstrip("/") + "/"

        response = await loop.run_in_executor(
            None,
            functools.partial(
                self._bucket.objects.filter,
                Prefix=key
            )
        )

        for object in response:
            if object.key.endswith('/'):
                continue
            yield object.key[len(str(self.filename))+1:]

    async def refresh_bucket(self) -> None:
        """
        Refresh the S3 bucket if needed.
        """
        aws_config = schemas.AwsS3ConfigSchema(**self._config.model_dump())

        if self._session is None:

            self._session = AwsSession(config=aws_config)

        if self._bucket is None:
            resource = await self._session.get_resource(service_name="s3")

            loop = asyncio.get_running_loop()

            self._bucket = await loop.run_in_executor(
                None,
                functools.partial(
                    resource.Bucket,
                    name=self._session.resolve_config(
                        aws_config.aws_bucket_name)
                )
            )

    async def _get_object_metadata(
        self,
        key: str
    ) -> BucketObjectMetadata | None:
        """
        Retrieve the matadata for an S3 object.
        """
        loop = asyncio.get_running_loop()

        await self.refresh_bucket()
        if self._bucket is None:
            raise Exception("Bucket not initialized.")

        response = await loop.run_in_executor(
            None,
            functools.partial(
                self._bucket.objects.filter,
                Prefix=key
            )
        )

        matched_object = None
        for object in response:
            if object.key == key:
                matched_object = object

        if matched_object is None:
            return None

        response = await loop.run_in_executor(
            None,
            matched_object.get
        )

        return BucketObjectMetadata(**(response))

    async def _download_fileobj(
        self,
        stream: io.BytesIO
    ) -> None:
        loop = asyncio.get_running_loop()

        await self.refresh_bucket()
        if self._bucket is None:
            raise Exception("Bucket not initialized.")

        await loop.run_in_executor(
            None,
            functools.partial(
                self._bucket.download_fileobj,
                Key=str(self.filename),
                Fileobj=stream
            )
        )
        stream.seek(0)

# ---------------------------------------------------------------------------- #
