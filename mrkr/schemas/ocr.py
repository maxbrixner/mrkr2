# ---------------------------------------------------------------------------- #

import pydantic
import enum
import uuid
from typing import Any, List, Optional

# ---------------------------------------------------------------------------- #


class OcrItemType(str, enum.Enum):
    # Textract knows: 'KEY_VALUE_SET'|'PAGE'|'LINE'|'WORD'|'TABLE'|'CELL'|
    # 'SELECTION_ELEMENT'|'MERGED_CELL'|'TITLE'|'QUERY'|'QUERY_RESULT'|
    # 'SIGNATURE'|'TABLE_TITLE'|'TABLE_FOOTER'|'LAYOUT_TEXT'|'LAYOUT_TITLE'|
    # 'LAYOUT_HEADER'|'LAYOUT_FOOTER'|'LAYOUT_SECTION_HEADER'|
    # 'LAYOUT_PAGE_NUMBER'|'LAYOUT_LIST'|'LAYOUT_FIGURE'|
    # 'LAYOUT_TABLE'|'LAYOUT_KEY_VALUE',
    page = "page"
    block = "block"
    paragraph = "paragraph"
    line = "line"
    word = "word"

# ---------------------------------------------------------------------------- #


class OcrRelationshipType(str, enum.Enum):
    # Textract knows: 'VALUE'|'CHILD'|'COMPLEX_FEATURES'|'MERGED_CELL'|
    # 'TITLE'|'ANSWER'|'TABLE'|'TABLE_TITLE'|'TABLE_FOOTER',
    child = "child"

# ---------------------------------------------------------------------------- #


class OcrRelationshipSchema(pydantic.BaseModel):
    type: OcrRelationshipType = pydantic.Field(
        ...,
        description="The type of the relationship.",
        examples=["child"]
    )
    id: uuid.UUID = pydantic.Field(
        ...,
        description="The ID of the related OCR item (as a UUID4).",
        examples=["123e4567-e89b-12d3-a456-426614174000"]
    )

    @pydantic.field_serializer('id', when_used='always')
    def serialize_uuid(self, value: uuid.UUID, _info: Any) -> str:
        return str(value)

# ---------------------------------------------------------------------------- #


class OcrItemSchema(pydantic.BaseModel):
    id: uuid.UUID = pydantic.Field(
        ...,
        description="The unique identifier for the OCR item (as a UUID4).",
        examples=["123e4567-e89b-12d3-a456-426614174000"]
    )
    type: OcrItemType = pydantic.Field(
        ...,
        description="The type of the OCR item.",
        examples=["page"]
    )
    left: float = pydantic.Field(
        ...,
        description="The left coordinate of the item in the image, "
                    "normalized to [0, 1].",
        examples=[0.1]
    )
    top: float = pydantic.Field(
        ...,
        description="The top coordinate of the item in the image, "
                    "normalized to [0, 1].",
        examples=[0.1]
    )
    width: float = pydantic.Field(
        ...,
        description="The width of the item in the image, "
                    "normalized to [0, 1].",
        examples=[0.8]
    )
    height: float = pydantic.Field(
        ...,
        description="The height of the item in the image, "
                    "normalized to [0, 1].",
        examples=[0.2]
    )
    page: int = pydantic.Field(
        ...,
        description="The page number where the item is located "
                    "(starting from 1).",
        examples=[1]
    )
    confidence: Optional[float] = pydantic.Field(
        None,
        description="The confidence score of the OCR item as a percentage",
        examples=[95]
    )
    content: Optional[str] = pydantic.Field(
        None,
        description="The text content of the OCR item.",
        examples=["Test content"]
    )
    relationships: List[OcrRelationshipSchema] = pydantic.Field(
        [],
        description="A list of relationships to other OCR items.",
        examples=[
            {
                "type": "child",
                "id": "123e4567-e89b-12d3-a456-426614174000"
            }
        ]
    )

    @pydantic.field_serializer('id', when_used='always')
    def serialize_uuid(self, value: uuid.UUID, _info: Any) -> str:
        return str(value)

# ---------------------------------------------------------------------------- #


class OcrResultSchema(pydantic.BaseModel):
    id: uuid.UUID = pydantic.Field(
        ...,
        description="The unique identifier for the OCR result (as a UUID4).",
        examples=["123e4567-e89b-12d3-a456-426614174000"]
    )
    items: List[OcrItemSchema] = pydantic.Field(
        ...,
        description="A list of OCR items extracted from the document.",
        examples=[
            [{
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "type": "page",
                "left": 0.0,
                "top": 0.0,
                "width": 1.0,
                "height": 1.0,
                "confidence": None,
                "content": None,
                "relationships": []
            }]
        ]
    )

    @pydantic.field_serializer('id', when_used='always')
    def serialize_uuid(self, value: uuid.UUID, _info: Any) -> str:
        return str(value)

# ---------------------------------------------------------------------------- #
