# ---------------------------------------------------------------------------- #

import io
import pdf2image
import logging
import base64
import asyncio
import functools
from PIL import Image
from typing import Any, AsyncGenerator, List, Optional, Self


import mrkr.schemas as schemas

# ---------------------------------------------------------------------------- #

logger = logging.getLogger("mrkr.providers.file")

# ---------------------------------------------------------------------------- #


class BaseFileProvider:
    """
    A provider that handles file operations.
    """
    path: str
    _config: schemas.FileProviderConfig
    _stream: io.BufferedReader | None
    _is_file: bool
    _is_folder: bool

    def __init__(self, config: schemas.FileProviderConfig) -> None:
        """
        Initializes the BaseFileProvider with a file path and optional PDF DPI.
        """
        self.path = ''
        self._stream = None
        self._is_file = False
        self._is_folder = False
        self._config = config

    def __call__(self, path: str) -> Self:
        """
        Sets the file path for the provider.
        """
        self.path = path
        return self

    async def __aenter__(
        self
    ) -> Self:
        """
        Implement this method to provide file reading functionality. If the
        path is a file, it should store a binary file stream in
        self._file, set _is_file to true, and return self. If the path is a
        folder, it should set _is_folder to true and return self. If the path
        is neither a file nor a folder, it should raise a FileNotFoundError.
        """
        return self

    async def __aexit__(
        self,
        exc_type: Any,
        exc_value: Any,
        traceback: Any
    ) -> None:
        """
        Implement this method to close the file stream.
        """
        pass

    async def read(self) -> bytes:
        """
        Implement this method to read the file and return its content as bytes.
        """
        raise NotImplementedError

    async def list(self) -> AsyncGenerator[str, None]:
        """
        Implement this method to list the files in the directory if the path is
        a folder. If the path is a file, it should raise an exception.
        """
        raise NotImplementedError
        yield ""  # Placeholder for AsyncGenerator

    async def read_as_images(
        self,
        page: Optional[int] = None
    ) -> List[Image.Image]:
        """
        Converts the file to an image or a list of images.
        """
        logger.debug(f"Reading file as images for: '{self.path}'")

        if self.path.lower().endswith('.pdf'):
            images = await self._convert_pdf_to_images(page=page)
        else:
            if not page or page == 1:
                images = [await self._read_image_file()]
            else:
                return []

        return images

    async def read_as_base64_images(
        self,
        page: Optional[int] = None,
        format: str = "JPEG"
    ) -> List[str]:
        """
        Converts the file to a list of base64 encoded images.
        """
        logger.debug(
            f"Reading file as base64 encoded images for: '{self.path}'")

        images = await self.read_as_images(page=page)

        loop = asyncio.get_running_loop()

        result = []
        for image in images:
            bytes = io.BytesIO()
            await loop.run_in_executor(
                None,
                functools.partial(
                    image.save,
                    bytes,
                    format=format
                )
            )
            bytes.seek(0)
            base64_string = await self._convert_to_base64(bytes.getvalue())
            result.append(base64_string)

        return result

    async def _convert_to_base64(self, bytes: bytes) -> str:
        """
        Converts bytes to a base64 encoded string.
        """
        loop = asyncio.get_running_loop()
        encoded_bytes = await loop.run_in_executor(
            None, base64.b64encode, bytes)
        text = await loop.run_in_executor(
            None, encoded_bytes.decode, 'utf-8')
        return text

    @property
    async def image_metadata(
        self
    ) -> schemas.DocumentMetadataSchema:
        """
        Converts the file to an image or a list of images if the file is a PDF.
        If the file is not a PDF, it raises an exception.
        """
        logger.debug(f"Getting image metadata for: '{self.path}'")

        images = await self.read_as_images()

        pages = []
        for image in images:
            pages.append(
                schemas.PageMetadataSchema(
                    page=images.index(image) + 1,
                    width=image.width,
                    height=image.height,
                    aspect_ratio=round(image.width / image.height, 7),
                    format=image.format,
                    mode=image.mode
                )
            )

        return schemas.DocumentMetadataSchema(
            path=self.path,
            pages=pages
        )

    async def _read_image_file(
        self
    ) -> Image.Image:
        """
        Reads an image file and returns it as an Image object.
        """
        try:
            loop = asyncio.get_running_loop()
            bytes = await self.read()
            image = await loop.run_in_executor(None, Image.open, io.BytesIO(bytes))
            return image
        except Exception as e:
            raise Exception(
                f"Failed to read image file: {e}"
            )

    async def _convert_pdf_to_images(
        self,
        page: Optional[int] = None
    ) -> List[Image.Image]:
        """
        Converts a PDF file to a list of images.
        """
        logger.debug(f"Converting PDF to images for: '{self.path}'")

        try:
            loop = asyncio.get_running_loop()
            bytes = await self.read()

            if not page:
                images = await loop.run_in_executor(
                    None,
                    functools.partial(
                        pdf2image.convert_from_bytes,
                        bytes,
                        dpi=self._config.pdf_dpi
                    )
                )
                return images
            else:
                images = await loop.run_in_executor(
                    None,
                    functools.partial(
                        pdf2image.convert_from_bytes,
                        bytes,
                        dpi=self._config.pdf_dpi,
                        first_page=page,
                        last_page=page
                    )
                )
                return images
        except Exception as e:
            raise Exception(
                f"Failed to convert PDF to images: {e}"
            )

    def is_file(self) -> bool:
        """
        Returns True if the path is a file, False otherwise.
        """
        return self._is_file

    def is_folder(self) -> bool:
        """
        Returns True if the path is a folder, False otherwise.
        """
        return self._is_folder

# ---------------------------------------------------------------------------- #
