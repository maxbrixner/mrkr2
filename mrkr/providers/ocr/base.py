# ---------------------------------------------------------------------------- #

import logging
from typing import Any, List, Self
from PIL import Image

# ---------------------------------------------------------------------------- #

import mrkr.schemas as schemas

# ---------------------------------------------------------------------------- #

logger = logging.getLogger("mrkr.providers.ocr")

# ---------------------------------------------------------------------------- #


class BaseOcrProvider:
    """
    A provider that handles OCR operations on files.
    """
    _images: List[Image.Image]

    def __init__(self, images: Image.Image | List[Image.Image]):
        if isinstance(images, Image.Image):
            self._images = [images]
        else:
            self._images = images

    def __enter__(self) -> Self:
        """
        Implement this method to initialize the OCR provider. Should return
        self.
        """
        return self

    def __exit__(self, exc_type: Any, exc_value: Any, traceback: Any) -> None:
        """
        Implement this method to clean up resources used by the OCR provider.
        """
        pass

    def ocr(self) -> schemas.OcrResultSchema:
        """
        Implement this method to perform OCR on the file and return the result.
        """
        raise NotImplementedError

# ---------------------------------------------------------------------------- #
