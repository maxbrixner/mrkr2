# ---------------------------------------------------------------------------- #

import pathlib
import logging
import asyncio
from typing import AsyncGenerator, Optional

# ---------------------------------------------------------------------------- #

import mrkr.schemas as schemas
from .base import BaseFileProvider

# ---------------------------------------------------------------------------- #

logger = logging.getLogger("mrkr.providers.file")

# ---------------------------------------------------------------------------- #


class LocalFileProvider(BaseFileProvider):
    """
    A provider that handles local file operations.
    """
    _config: schemas.FileProviderLocalConfigSchema

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
        loop = asyncio.get_running_loop()
        is_folder = await loop.run_in_executor(
            None, self.filename.is_dir)
        return is_folder

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

        try:
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
        except Exception as exception:
            raise exception
        finally:
            stream.close()

    async def list(self) -> AsyncGenerator[str, None]:
        """
        Lists the contents of the directory if the path is a folder.
        """
        logger.debug(f"Listing files for path: '{self.filename}'")

        if not await self.is_folder:
            raise Exception(f"Object '{self.filename}' is not a folder.")

        for item in pathlib.Path(self.filename).iterdir():
            if item.is_file():
                yield str(item.relative_to(self.filename))

# ---------------------------------------------------------------------------- #
