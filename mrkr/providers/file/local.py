# ---------------------------------------------------------------------------- #

import pathlib
import logging
import asyncio
from typing import Any, List, Self

# ---------------------------------------------------------------------------- #

from .base import BaseFileProvider

# ---------------------------------------------------------------------------- #

logger = logging.getLogger("mrkr.providers.file")

# ---------------------------------------------------------------------------- #


class LocalFileProvider(BaseFileProvider):
    """
    A provider that handles local file operations.
    """

    def __init__(self, path: str):
        super().__init__(path)

    async def __aenter__(self) -> Self:
        """
        Reads the file and returns a binary file stream if the path is a file,
        or sets _is_folder to true if the path is a folder.
        """
        logger.debug(f"Opening file or folder at path: '{self.path}'")

        filename = pathlib.Path(self.path)

        if filename.is_dir():
            self._is_folder = True
            return self

        if filename.is_file():
            self._is_file = True
            self._stream = pathlib.Path(self.path).open("rb")
            return self

        raise FileNotFoundError(f"Path {filename} not found.")

    async def __aexit__(
        self,
        exc_type: Any,
        exc_value: Any,
        traceback: Any
    ) -> None:
        """
        Closes the file stream.
        """
        if self._stream:
            self._stream.close()

    async def read(self) -> bytes:
        """
        Reads the file and returns its content as bytes.
        """
        logger.debug(f"Reading file content for: '{self.path}'")

        if not self._is_file:
            raise Exception(f"Object '{self.path}' is not a file.")

        if self._stream is None:
            raise Exception(
                "File stream is not open. Use 'with' statement to open "
                "the file."
            )

        loop = asyncio.get_event_loop()
        content = await loop.run_in_executor(None, self._stream.read)

        return content

    async def list(self) -> List[str]:
        """
        Lists the contents of the directory if the path is a folder.
        """
        # todo: make this asnyc
        logger.debug(f"Listing files for path: '{self.path}'")

        if not self._is_folder:
            raise Exception(f"Object '{self.path}' is not a folder.")

        return [str(item) for item in pathlib.Path(self.path).iterdir()]

# ---------------------------------------------------------------------------- #
