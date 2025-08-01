# ---------------------------------------------------------------------------- #

import logging
import pytesseract
import pydantic
import uuid
import asyncio
import functools
from typing import List

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
    _config: schemas.OcrProviderTesseractConfigSchema

    def __init__(
        self,
        config: schemas.OcrProviderTesseractConfigSchema
    ) -> None:
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

    async def ocr(self) -> schemas.OcrResultSchema:
        """
        Perform OCR on the file and return the result.
        """
        items = []
        for page, image in enumerate(self._images):
            ocr = await self._ocr_image(page=page+1)
            items += self._convert_result(
                result=ocr,
                dimensions=image.size,
                page=page + 1
            )

        return schemas.OcrResultSchema(
            id=uuid.uuid4(),
            items=items
        )

    async def _ocr_image(self, page: int) -> TesseractResult:
        """
        Perform OCR on a single image and return the result.
        """
        if page < 1 or page > len(self._images):
            raise Exception(f"Page {page} is out of range.")

        logger.debug(f"Performing OCR on page {page}.")

        loop = asyncio.get_running_loop()

        output = await loop.run_in_executor(
            None,
            functools.partial(
                pytesseract.image_to_data,
                image=self._images[page-1],
                output_type=pytesseract.Output.DICT,
                config="--psm 1",
                lang=self._config.language
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

    def _get_short_line_id(
        self,
        result: TesseractResult,
        line: int
    ) -> str:
        """
        Generate a unique ID for a line based on its attributes.
        """
        short_id = f"{result.page_num[line]}" \
            + f"_{result.block_num[line]}" if result.block_num[line] != 0 else "" \
            + f"_{result.par_num[line]}" if result.par_num[line] != 0 else "" \
            + f"_{result.line_num[line]}" if result.line_num[line] != 0 else "" \
            + f"_{result.word_num[line]}" if result.word_num[line] != 0 else ""

        return short_id

    def _get_parent_id(
        self,
        result: TesseractResult,
        line: int
    ) -> str | None:
        """
        Get the parent ID of a line in the Tesseract result.
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

    def _get_children_ids(
        self,
        result: TesseractResult,
        line: int
    ) -> List[str]:
        """
        Get the parent ID of a line in the Tesseract result.
        """
        children_ids = []
        for index in range(len(result.level)):
            if result.level[index] != result.level[line] + 1:
                # just return the immediate children to avoid double
                # counting
                continue

            if result.level[line] == 1:  # line is a page
                if result.page_num[index] == result.page_num[line]:
                    children_ids.append(self._get_line_id(
                        result=result, line=index))
            elif result.level[line] == 2:  # line is a block
                if result.page_num[index] == result.page_num[line] and \
                   result.block_num[index] == result.block_num[line]:
                    children_ids.append(self._get_line_id(
                        result=result, line=index))
            elif result.level[line] == 3:  # line is a paragraph
                if result.page_num[index] == result.page_num[line] and \
                   result.block_num[index] == result.block_num[line] and \
                        result.par_num[index] == result.par_num[line]:
                    children_ids.append(self._get_line_id(
                        result=result, line=index))
            elif result.level[line] == 4:  # line is a line
                if result.page_num[index] == result.page_num[line] and \
                   result.block_num[index] == result.block_num[line] and \
                   result.par_num[index] == result.par_num[line] and \
                   result.line_num[index] == result.line_num[line]:
                    children_ids.append(self._get_line_id(
                        result=result, line=index))

        return children_ids

    def _create_item_map(
        self,
        result: TesseractResult
    ) -> dict[str, uuid.UUID]:
        """
        Create a map of relationships between items based on their IDs.
        """
        relationship_map = {}
        for i in range(len(result.level)):
            item_id = self._get_line_id(result=result, line=i)

            if item_id not in relationship_map:
                relationship_map[item_id] = uuid.uuid4()
            else:
                raise Exception("Duplicate item ID found.")

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
        item_map = self._create_item_map(result=result)

        items = []
        for i in range(len(result.level)):
            id = self._get_line_id(result=result, line=i)

            children = self._get_children_ids(
                result=result,
                line=i
            )

            relationships = []
            for child in children:
                relationships.append(
                    schemas.OcrRelationshipSchema(
                        type=schemas.OcrRelationshipType.child,
                        id=item_map[child]
                    )
                )

            item = schemas.OcrItemSchema(
                id=item_map[id],
                type=self._type_map[result.level[i]],
                page=page,
                left=round(result.left[i] / dimensions[0], 5),
                top=round(result.top[i] / dimensions[1], 5),
                width=round(result.width[i] / dimensions[0], 5),
                height=round(result.height[i] / dimensions[1], 5),
                confidence=result.conf[i] if result.conf[i] != -1 else None,
                content=result.text[i] if len(result.text[i]) > 0 else None,
                relationships=relationships
            )

            items.append(item)

        return items

# ---------------------------------------------------------------------------- #
