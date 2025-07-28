# ---------------------------------------------------------------------------- #

import logging
from typing import Any, Self

# ---------------------------------------------------------------------------- #

import mrkr.schemas as schemas
from .base import BaseOcrProvider
from ..aws import AwsSession, AsyncTextractWrapper

# ---------------------------------------------------------------------------- #

logger = logging.getLogger("mrkr.providers.ocr")

# ---------------------------------------------------------------------------- #


class TextractOcrProvider(BaseOcrProvider):
    """
    A provider that uses Textract OCR to perform optical character recognition
    on images.
    """

    _config: schemas.OcrProviderTesseractConfigSchema
    _session: AwsSession | None
    _client: AsyncTextractWrapper | None

    def __init__(
        self,
        config: schemas.OcrProviderTextractConfigSchema
    ) -> None:
        """
        Initializes the TextractOcrProvider with a configuration.
        """
        super().__init__(config=config)

        self._session = None
        self._client = None

    async def __aenter__(self) -> Self:
        """
        Implement this method to initialize the OCR provider.
        """
        return self

    async def __aexit__(
        self,
        exc_type: Any,
        exc_value: Any,
        traceback: Any
    ) -> None:
        """
        Implement this method to clean up resources used by the OCR provider.
        """
        pass

    async def ocr(self) -> schemas.OcrResultSchema:
        """
        Perform OCR on the file and return the result.
        """
        await self.refresh_client()
        raise NotImplementedError("Textract is not implemented yet.")

    async def refresh_client(self) -> None:
        """
        Refresh the Textract client if needed.
        """
        if self._session is None:
            aws_config = schemas.AwsConfigSchema(**self._config.model_dump())
            self._session = AwsSession(config=aws_config)

        if self._client is None:
            self._client = await self._session.get_async_textract_client()

# ---------------------------------------------------------------------------- #
