# ---------------------------------------------------------------------------- #

import logging
import asyncio
import functools
import io
from typing import Any

# ---------------------------------------------------------------------------- #

import mrkr.schemas as schemas
from .base import BaseOcrProvider
from ..aws import AwsSession

# ---------------------------------------------------------------------------- #

logger = logging.getLogger("mrkr.providers.ocr")

# ---------------------------------------------------------------------------- #


class TextractOcrProvider(BaseOcrProvider):
    """
    A provider that uses Textract OCR to perform optical character recognition
    on images.
    """

    _config: schemas.OcrProviderTextractConfigSchema
    _session: AwsSession | None
    _client: Any | None

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

    async def ocr(self) -> schemas.OcrResultSchema:
        """
        Perform OCR on the file and return the result.
        """
        await self.refresh_client()
        if self._client is None:
            raise Exception("Client not initialized.")

        loop = asyncio.get_running_loop()

        for page, image in enumerate(self._images):
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

            # todo: make this async and also use start_document_analysis instead?
            result = self._client.analyze_document(
                Document={
                    "Bytes": bytes.getvalue()
                },
                FeatureTypes=["LAYOUT"]
            )

            print(result)

        raise NotImplementedError("Textract is not implemented yet.")

    async def refresh_client(self) -> None:
        """
        Refresh the Textract client if needed.
        """
        aws_config = schemas.AwsTextractConfigSchema(
            **self._config.model_dump())

        if self._session is None:
            self._session = AwsSession(config=aws_config)

        if self._client is None:
            self._client = await self._session.get_client(
                service_name="textract"
            )

# ---------------------------------------------------------------------------- #
