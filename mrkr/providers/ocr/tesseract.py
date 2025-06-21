# ---------------------------------------------------------------------------- #

import logging
import pytesseract
import pydantic
import uuid
import asyncio
import functools
from typing import Any, List, Optional, Self
from PIL import Image

# ---------------------------------------------------------------------------- #

import mrkr.schemas as schemas
from .base import BaseOcrProvider

# ---------------------------------------------------------------------------- #

logger = logging.getLogger("mrkr.providers.ocr")

# ---------------------------------------------------------------------------- #


class TesseractResult(pydantic.BaseModel):
    level: List[int]
    page_num: List[int]
    block_num: List[int]
    par_num: List[int]
    line_num: List[int]
    word_num: List[int]
    left: List[int]
    top: List[int]
    width: List[int]
    height: List[int]
    conf: List[int]
    text: List[str]

# ---------------------------------------------------------------------------- #


class TesseractOcrProvider(BaseOcrProvider):
    """
    A provider that uses Tesseract OCR to perform optical character recognition
    on images.
    """

    _type_map: dict[int, schemas.OcrItemType]

    def __init__(self, config: schemas.OcrProviderTesseractConfig) -> None:
        """
        Initializes the TesseractOcrProvider with a configuration.
        """
        super().__init__(config=config)
        self._type_map = {
            1: schemas.OcrItemType.page,
            2: schemas.OcrItemType.block,
            3: schemas.OcrItemType.paragraph,
            4: schemas.OcrItemType.line,
            5: schemas.OcrItemType.word
        }

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
        Implement this method to perform OCR on the file and return the result.
        """
        blocks = []
        for page, image in enumerate(self._images):
            ocr = await self._ocr_image(page=page+1)
            blocks += self._convert_result(
                result=ocr,
                dimensions=image.size,
                page=page + 1
            )

        return schemas.OcrResultSchema(
            id=uuid.uuid4(),
            blocks=blocks,
            labels=[]
        )

    async def _ocr_image(self, page: int) -> TesseractResult:
        """
        Perform OCR on a single image and return the result.
        """
        if page < 1 or page > len(self._images):
            raise Exception(f"Page {page} is out of range.")

        logger.debug(f"Performing OCR on page {page}.")

        loop = asyncio.get_event_loop()

        output = await loop.run_in_executor(
            None,
            functools.partial(
                pytesseract.image_to_data,
                image=self._images[page-1],
                output_type=pytesseract.Output.DICT,
                config="--psm 1"
            )
        )

        result = TesseractResult(**output)

        return result

    def _get_line_id(
        self,
        result: TesseractResult,
        line: int
    ) -> str:
        """
        Generate a unique ID for a line based on its attributes.
        """
        return f"{result.page_num[line]}_" \
            f"{result.block_num[line]}_" \
            f"{result.par_num[line]}_" \
            f"{result.line_num[line]}_" \
            f"{result.word_num[line]}"

    def _get_parent_id(
        self,
        result: TesseractResult,
        line: int
    ) -> str | None:
        """
        Generate a unique ID for a line based on its attributes.
        """
        match self._type_map[result.level[line]]:
            case schemas.OcrItemType.page:
                return None
            case schemas.OcrItemType.block:
                return f"{result.page_num[line]}_0_0_0_0"
            case schemas.OcrItemType.paragraph:
                return f"{result.page_num[line]}_" \
                    f"{result.block_num[line]}_0_0_0"
            case schemas.OcrItemType.line:
                return f"{result.page_num[line]}_" \
                    f"{result.block_num[line]}_" \
                    f"{result.par_num[line]}_0_0"
            case schemas.OcrItemType.word:
                return f"{result.page_num[line]}_" \
                    f"{result.block_num[line]}_" \
                    f"{result.par_num[line]}_" \
                    f"{result.line_num[line]}_0"
            case _:
                return None

    def _create_block_map(
        self,
        result: TesseractResult
    ) -> dict[str, uuid.UUID]:
        """
        Create a map of relationships between blocks based on their IDs.
        """
        relationship_map = {}
        for i in range(len(result.level)):
            block_id = self._get_line_id(result=result, line=i)

            if block_id not in relationship_map:
                relationship_map[block_id] = uuid.uuid4()
            else:
                raise Exception("Duplicate block ID found.")

        return relationship_map

    def _convert_result(
        self,
        result: TesseractResult,
        dimensions: tuple[int, int],
        page: int
    ) -> List[schemas.OcrItemSchema]:
        """
        Convert the Tesseract OCR result to the target schema.
        """
        type_map = {
            1: schemas.OcrItemType.page,
            2: schemas.OcrItemType.block,
            3: schemas.OcrItemType.paragraph,
            4: schemas.OcrItemType.line,
            5: schemas.OcrItemType.word
        }
        block_map = self._create_block_map(result=result)

        blocks = []
        for i in range(len(result.level)):
            id = self._get_line_id(result=result, line=i)
            parent_id = self._get_parent_id(result=result, line=i)

            if parent_id:
                relationships = [
                    schemas.OcrRelationshipSchema(
                        type=schemas.OcrRelationshipType.child,
                        id=block_map[parent_id]
                    )
                ]
            else:
                relationships = []

            block = schemas.OcrItemSchema(
                id=block_map[id],
                type=type_map[result.level[i]],
                page=page,
                left=round(result.left[i] / dimensions[0], 5),
                top=round(result.top[i] / dimensions[1], 5),
                width=round(result.width[i] / dimensions[0], 5),
                height=round(result.height[i] / dimensions[1], 5),
                confidence=result.conf[i] if result.conf[i] != -1 else None,
                content=result.text[i] if len(result.text[i]) > 0 else None,
                relationships=relationships,
                labels=[],
                user_content=None
            )

            blocks.append(block)

        return blocks

# ---------------------------------------------------------------------------- #
