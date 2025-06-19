# ---------------------------------------------------------------------------- #

import io
import pdf2image
import logging
import base64
from PIL import Image
from typing import Any, List, Optional, Self

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
    _pdf_dpi: int
    _stream: io.BufferedReader | None
    _is_file: bool
    _is_folder: bool

    def __init__(self, path: str, pdf_dpi: int = 200):
        self.path = path
        self._pdf_dpi = pdf_dpi
        self._stream = None
        self._is_file = False
        self._is_folder = False

    def __enter__(
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

    def __exit__(self, exc_type: Any, exc_value: Any, traceback: Any) -> None:
        """
        Implement this method to close the file stream.
        """
        pass

    def read(self) -> bytes:
        """
        Implement this method to read the file and return its content as bytes.
        """
        raise NotImplementedError

    def list(self) -> List[str]:
        """
        Implement this method to list the files in the directory if the path is
        a folder. If the path is a file, it should raise an exception.
        """
        raise NotImplementedError

    def read_as_images(
        self,
        page: Optional[int] = None
    ) -> List[Image.Image]:
        """
        Converts the file to an image or a list of images.
        """
        logger.debug(f"Reading file as images for: '{self.path}'")

        if self.path.lower().endswith('.pdf'):
            images = self._convert_pdf_to_images(page=page)
        else:
            images = [self._read_image_file()]

        return images

    def read_as_base64_images(
        self,
        page: Optional[int] = None,
        format: str = "JPEG"
    ) -> List[str]:
        """
        Converts the file to an image or a list of base64 encoded images.
        """
        logger.debug(
            f"Reading file as base64 encoded images for: '{self.path}'")

        images = self.read_as_images(page=page)

        result = []
        for image in images:
            bytes = io.BytesIO()
            image.save(bytes, format=format)
            bytes.seek(0)
            encoded_bytes = base64.b64encode(bytes.read())
            base64_string = encoded_bytes.decode('utf-8')
            result.append(base64_string)

        return result

    @property
    def image_metadata(
        self
    ) -> schemas.FileMetadataSchema:
        """
        Converts the file to an image or a list of images if the file is a PDF.
        If the file is not a PDF, it raises an exception.
        """
        logger.debug(f"Getting image metadata for: '{self.path}'")

        images = self.read_as_images()

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

        return schemas.FileMetadataSchema(
            path=self.path,
            pages=pages
        )

    def _read_image_file(
        self
    ) -> Image.Image:
        """
        Reads an image file and returns it as an Image object.
        """
        try:
            image = Image.open(io.BytesIO(self.read()))
            return image
        except Exception as e:
            raise Exception(
                f"Failed to read image file: {e}"
            )

    def _convert_pdf_to_images(
        self,
        page: Optional[int] = None
    ) -> List[Image.Image]:
        """
        Converts a PDF file to a list of images.
        """
        logger.debug(f"Converting PDF to images for: '{self.path}'")

        try:
            if not page:
                images = pdf2image.convert_from_bytes(
                    self.read(),
                    dpi=self._pdf_dpi
                )
                return images
            else:
                images = pdf2image.convert_from_bytes(
                    self.read(),
                    dpi=self._pdf_dpi,
                    first_page=page,
                    last_page=page
                )
                return images
        except Exception as e:
            raise Exception(
                f"Failed to convert PDF to images: {e}"
            )

# ---------------------------------------------------------------------------- #
