# ---------------------------------------------------------------------------- #

import logging
import asyncio
import functools
import io
import uuid
import pydantic
from PIL import Image
from typing import Any, Dict, List, Optional

# ---------------------------------------------------------------------------- #

import mrkr.schemas as schemas
from .base import BaseOcrProvider
from ..aws import AwsSession

# ---------------------------------------------------------------------------- #

logger = logging.getLogger("mrkr.providers.ocr")

# ---------------------------------------------------------------------------- #


class TextractBoundingBox(pydantic.BaseModel):
    width: float = pydantic.Field(alias="Width")
    height: float = pydantic.Field(alias="Height")
    left: float = pydantic.Field(alias="Left")
    top: float = pydantic.Field(alias="Top")


class TextractGeometry(pydantic.BaseModel):
    bounding_box: TextractBoundingBox = pydantic.Field(alias="BoundingBox")


class TextractRelationship(pydantic.BaseModel):
    type: str = pydantic.Field(alias="Type")
    ids: List[str] = pydantic.Field(alias="Ids")


class TextractBlock(pydantic.BaseModel):
    id: str = pydantic.Field(alias="Id")
    block_type: str = pydantic.Field(alias="BlockType")
    confidence: Optional[float] = pydantic.Field(
        default=None, alias="Confidence")
    text: Optional[str] = pydantic.Field(default=None, alias="Text")
    geometry: TextractGeometry = pydantic.Field(alias="Geometry")
    relationships: List[TextractRelationship] = pydantic.Field(
        default=[], alias="Relationships")


class TextractResult(pydantic.BaseModel):
    blocks: List[TextractBlock] = pydantic.Field(alias="Blocks")

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
        items = []
        for page, image in enumerate(self._images):

            textract_result = await self._analyze_page(
                image=image)

            items += await self._convert_result(
                textract_result=textract_result,
                page=page+1
            )

        ocr_result = schemas.OcrResultSchema(
            id=uuid.uuid4(),
            items=items
        )

        return ocr_result

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

    async def _analyze_page(self, image: Image.Image) -> TextractResult:
        """
        Call Textract to analyze the document layout.
        """
        await self.refresh_client()
        if self._client is None:
            raise Exception("Client not initialized.")

        loop = asyncio.get_running_loop()

        if image.mode != "RGB":
            logger.debug("Converting image to RGB mode for Textract.")
            image = await loop.run_in_executor(
                None,
                functools.partial(
                    image.convert,
                    mode="RGB"
                )
            )

        logger.debug("Calling Textract to analyze the page...")

        bytesIO = io.BytesIO()
        await loop.run_in_executor(
            None,
            functools.partial(
                image.save,
                fp=bytesIO,
                format=self._config.image_format
            )
        )

        bytesIO.seek(0)

        result = await loop.run_in_executor(
            None,
            functools.partial(
                self._client.analyze_document,
                Document={
                    "Bytes": bytesIO.getvalue()
                },
                FeatureTypes=["LAYOUT"]
            )
        )

        logger.debug("Textract analysis successful.")

        return TextractResult(**result)

    def map_block_type(
        self,
        textract_type: str
    ) -> schemas.OcrItemType | None:
        """
        Maps Textract block types to internal OcrItemType.
        """
        # 'KEY_VALUE_SET' | 'TABLE' | 'CELL' | 'SELECTION_ELEMENT' |
        # 'MERGED_CELL' | 'TITLE' | 'QUERY' | 'QUERY_RESULT' | 'SIGNATURE' |
        # 'TABLE_TITLE' | 'TABLE_FOOTER' | 'LAYOUT_TEXT' | 'LAYOUT_TITLE' |
        # 'LAYOUT_HEADER' | 'LAYOUT_FOOTER' | 'LAYOUT_SECTION_HEADER' |
        # 'LAYOUT_PAGE_NUMBER' | 'LAYOUT_LIST' | 'LAYOUT_FIGURE' |
        # 'LAYOUT_TABLE' | 'LAYOUT_KEY_VALUE'
        match textract_type:
            case 'PAGE':
                return schemas.OcrItemType.page
            case 'LINE':
                return schemas.OcrItemType.line
            case 'WORD':
                return schemas.OcrItemType.word
            case _:
                return schemas.OcrItemType.block

    def map_relationship_type(
        self,
        textract_type: str
    ) -> schemas.OcrRelationshipType | None:
        """
        Maps Textract relationship types to internal OcrRelationshipType.
        """
        # 'VALUE'|'CHILD'|'COMPLEX_FEATURES'|'MERGED_CELL'| 'TITLE'|'ANSWER'|
        # 'TABLE'|'TABLE_TITLE'|'TABLE_FOOTER'
        match textract_type:
            case 'CHILD':
                return schemas.OcrRelationshipType.child
            case _:
                return None

    async def _convert_result(
        self,
        textract_result: TextractResult,
        page: int
    ) -> List[schemas.OcrItemSchema]:
        """
        Converts TextractResult to a list of OcrItemSchema.
        """
        items = []
        for block in textract_result.blocks:
            block_type = self.map_block_type(block.block_type)
            if not block_type:
                continue

            relationships = []
            for relationship in block.relationships:
                relationship_type = self.map_relationship_type(
                    relationship.type)
                if not relationship_type:
                    continue
                for id in relationship.ids:
                    relationships.append(
                        schemas.OcrRelationshipSchema(
                            type=relationship_type,
                            id=uuid.UUID(id)
                        )
                    )

            content = block.text \
                if block_type == schemas.OcrItemType.word else None

            items.append(schemas.OcrItemSchema(
                id=uuid.UUID(block.id),
                type=block_type,
                left=block.geometry.bounding_box.left,
                top=block.geometry.bounding_box.top,
                width=block.geometry.bounding_box.width,
                height=block.geometry.bounding_box.height,
                page=page,
                confidence=block.confidence,
                content=content,
                relationships=relationships
            ))

        return items

    async def _get_item_children(
        self,
        item: schemas.OcrItemSchema,
        items: List[schemas.OcrItemSchema]
    ) -> List[schemas.OcrItemSchema]:
        """
        Recursively finds the children of an item based on its relationships.
        """
        children = []
        for relationship in item.relationships:
            if relationship.type != schemas.OcrRelationshipType.child:
                continue
            child_item = next(
                (i for i in items if i.id == relationship.id), None)
            if child_item:
                children.append(child_item)
                children += await self._get_item_children(
                    item=child_item, items=items)

        return children

# ---------------------------------------------------------------------------- #
