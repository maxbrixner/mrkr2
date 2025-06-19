# ---------------------------------------------------------------------------- #

import io
import pdf2image
import pydantic
import logging
from PIL import Image
from typing import Any, List, Optional, Self

# ---------------------------------------------------------------------------- #

logger = logging.getLogger("mrkr.providers.file")

# ---------------------------------------------------------------------------- #


class PageMetadata(pydantic.BaseModel):
    aspect_ratio: float = pydantic.Field(
        ...,
        description="The aspect ratio of the page (width / height).",
        examples=[0.7066508])
    format: Optional[str] = pydantic.Field(
        default=None,
        description="The format of the image.",
        examples=["JPEG"])
    height: int = pydantic.Field(
        ...,
        description="The height of the page in pixels.",
        examples=[842])
    mode: str = pydantic.Field(
        ...,
        description="The color mode of the image (e.g., RGB).",
        examples=["RGB"])
    page: int = pydantic.Field(
        ...,
        description="The page number in the document (starting from 1).",
        examples=[1])
    width: int = pydantic.Field(
        ...,
        description="The width of the page in pixels.",
        examples=[595])

# ---------------------------------------------------------------------------- #


class FileMetadata(pydantic.BaseModel):
    path: str = pydantic.Field(
        ...,
        description="The path to the file.",
        examples=["/path/to/document.pdf"])
    pages: List[PageMetadata] = pydantic.Field(
        ...,
        description="Metadata for each page in the file.",
        examples=[
            [
                {
                    "aspect_ratio": 0.7066508,
                    "page": 1,
                    "width": 595,
                    "height": 842,
                    "format": "JPEG",
                    "mode": "RGB"
                },
                {
                    "aspect_ratio": 0.7066508,
                    "page": 2,
                    "width": 595,
                    "height": 842,
                    "format": "JPEG",
                    "mode": "RGB"
                }
            ]
        ])

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
        raise NotImplementedError

    def __exit__(self, exc_type: Any, exc_value: Any, traceback: Any) -> None:
        """
        Implement this method to close the file stream.
        """
        raise NotImplementedError

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
        Converts the file to an image or a list of images if the file is a PDF.
        If the file is not a PDF, it raises an exception.
        """
        logger.debug(f"Reading file as images for: '{self.path}'")

        if self.path.lower().endswith('.pdf'):
            return self._convert_pdf_to_images(page)
        else:
            return [self._read_image_file()]

    @property
    def image_metadata(
        self
    ) -> FileMetadata:
        """
        Converts the file to an image or a list of images if the file is a PDF.
        If the file is not a PDF, it raises an exception.
        """
        logger.debug(f"Getting image metadata for: '{self.path}'")

        images = self.read_as_images()

        pages = []
        for image in images:
            pages.append(
                PageMetadata(
                    page=images.index(image) + 1,
                    width=image.width,
                    height=image.height,
                    aspect_ratio=round(image.width / image.height, 7),
                    format=image.format,
                    mode=image.mode
                )
            )

        return FileMetadata(
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
            image = Image.open(self.path)
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
