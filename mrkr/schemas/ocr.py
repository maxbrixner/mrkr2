# ---------------------------------------------------------------------------- #

import pydantic
import enum
import uuid
from typing import Any, List, Optional

# ---------------------------------------------------------------------------- #


class OcrItemType(str, enum.Enum):
    page = "page"
    block = "block"
    paragraph = "paragraph"
    line = "line"
    word = "word"

# ---------------------------------------------------------------------------- #


class OcrRelationshipType(str, enum.Enum):
    child = "child"

# ---------------------------------------------------------------------------- #


class OcrRelationshipSchema(pydantic.BaseModel):
    type: OcrRelationshipType = pydantic.Field(
        ...,
        description="The type of the relationship.",
    )
    id: uuid.UUID = pydantic.Field(
        ...,
        description="The ID of the related OCR item (as a UUID4).",
    )

    @pydantic.field_serializer('id', when_used='always')
    def serialize_uuid(self, value: uuid.UUID, _info: Any) -> str:
        return str(value)

# ---------------------------------------------------------------------------- #


class OcrItemSchema(pydantic.BaseModel):
    id: uuid.UUID = pydantic.Field(
        ...,
        description="The unique identifier for the OCR item (as a UUID4).",
    )
    type: OcrItemType = pydantic.Field(
        ...,
        description="The type of the OCR item.",
    )
    left: float = pydantic.Field(
        ...,
        description="The left coordinate of the item in the image, "
                    "normalized to [0, 1].",
    )
    top: float = pydantic.Field(
        ...,
        description="The top coordinate of the item in the image, "
                    "normalized to [0, 1].",
    )
    width: float = pydantic.Field(
        ...,
        description="The width of the item in the image, "
                    "normalized to [0, 1].",
    )
    height: float = pydantic.Field(
        ...,
        description="The height of the item in the image, "
                    "normalized to [0, 1].",
    )
    page: int = pydantic.Field(
        ...,
        description="The page number where the item is located "
                    "(starting from 1).",
    )
    confidence: Optional[float] = pydantic.Field(
        None,
        description="The confidence score of the OCR item as a percentage",
    )
    content: Optional[str] = pydantic.Field(
        None,
        description="The text content of the OCR item.",
    )
    relationships: List[OcrRelationshipSchema] = pydantic.Field(
        [],
        description="A list of relationships to other OCR items.",
    )

    @pydantic.field_serializer('id', when_used='always')
    def serialize_uuid(self, value: uuid.UUID, _info: Any) -> str:
        return str(value)

# ---------------------------------------------------------------------------- #


class OcrResultSchema(pydantic.BaseModel):
    id: uuid.UUID = pydantic.Field(
        ...,
        description="The unique identifier for the OCR result (as a UUID4).",
    )
    items: List[OcrItemSchema] = pydantic.Field(
        ...,
        description="A list of OCR items extracted from the document."
    )

    @pydantic.field_serializer('id', when_used='always')
    def serialize_uuid(self, value: uuid.UUID, _info: Any) -> str:
        return str(value)

# ---------------------------------------------------------------------------- #
