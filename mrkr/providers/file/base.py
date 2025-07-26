# ---------------------------------------------------------------------------- #

import io
import pdf2image
import logging
import base64
import asyncio
import functools
from PIL import Image
from typing import Any, AsyncGenerator, List, Optional, Self

# ---------------------------------------------------------------------------- #

import mrkr.schemas as schemas

# ---------------------------------------------------------------------------- #

logger = logging.getLogger("mrkr.providers.file")

# ---------------------------------------------------------------------------- #


class BaseFileProvider:
    """
    A provider that handles file operations.
    """
    path: str
    _config: schemas.FileProviderConfigSchema

    def __init__(self, config: schemas.FileProviderConfigSchema) -> None:
        """
        Initializes the BaseFileProvider with a file path and optional PDF DPI.
        """
        self.path = ''
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
        Enters the context manager, allowing for file operations.
        """
        return self

    async def __aexit__(
        self,
        exc_type: Any,
        exc_value: Any,
        traceback: Any
    ) -> None:
        """
        Exits the context manager, cleaning up resources if necessary.
        """
        pass

    @property
    async def is_file(self) -> bool:
        """
        Returns True if the path is a file, False otherwise.
        """
        raise NotImplementedError

    @property
    async def is_folder(self) -> bool:
        """
        Returns True if the path is a folder, False otherwise.
        """
        raise NotImplementedError

    async def read(
        self,
        chunk_size: Optional[int] = None
    ) -> AsyncGenerator[bytes, None]:
        """
        Reads the file and returns its content as bytes. If the path is a
        folder, it should raise an exception.
        """
        raise NotImplementedError
        yield ""  # Placeholder for AsyncGenerator

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
            images = await self._read_pdf_file(page=page)
        else:
            if not page or page == 1:
                images = [await self._read_image_file()]
            else:
                return []

        return images

    async def read_as_base64_images(
        self,
        page: Optional[int] = None
    ) -> List[schemas.PageContentSchema]:
        """
        Converts the file to a list of base64 encoded images.
        """
        logger.debug(
            f"Reading file as base64 encoded images for: '{self.path}'")

        images = await self.read_as_images(page=page)

        loop = asyncio.get_running_loop()

        result = []
        for index, image in enumerate(images):
            bytes = io.BytesIO()
            await loop.run_in_executor(
                None,
                functools.partial(
                    image.save,
                    fp=bytes,
                    format=self._config.image_format
                )
            )
            bytes.seek(0)
            base64_string = await self._convert_to_base64(bytes.getvalue())
            result.append(
                schemas.PageContentSchema(
                    content=base64_string,
                    page=index+1 if page is None else page,
                    width=image.width,
                    height=image.height,
                    aspect_ratio=round(image.width / image.height, 7),
                    format=self._config.image_format.upper(),
                    mode=image.mode
                )
            )

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

    async def _read_image_file(
        self
    ) -> Image.Image:
        """
        Reads an image file and returns it as an image object.
        """
        try:
            chunks = []
            async for chunk in self.read():
                chunks.append(chunk)
            bytes = b"".join(chunks)

            loop = asyncio.get_running_loop()
            image = await loop.run_in_executor(
                None, Image.open, io.BytesIO(bytes))
            return image
        except Exception as e:
            raise Exception(
                f"Failed to read image file: {e}"
            )

    async def _read_pdf_file(
        self,
        page: Optional[int] = None
    ) -> List[Image.Image]:
        """
        Converts a PDF file to a list of images.
        """
        logger.debug(f"Converting PDF to images for: '{self.path}'")

        try:
            chunks = []
            async for chunk in self.read():
                chunks.append(chunk)
            bytes = b"".join(chunks)

            loop = asyncio.get_running_loop()

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
        except Exception as exception:
            raise Exception(
                f"Failed to convert PDF to images: {exception}"
            )

# ---------------------------------------------------------------------------- #
