# ---------------------------------------------------------------------------- #

import pydantic
import uuid
from typing import Any, Optional, List

# ---------------------------------------------------------------------------- #


class LabelDataSchema(pydantic.BaseModel):
    """
    Base schema for labels.
    """
    name: str = pydantic.Field(
        ...,
        description="The name of the label.",
        examples=["Customer Letter"]
    )

# ---------------------------------------------------------------------------- #


class TextLabelDataSchema(LabelDataSchema):
    """
    Schema for text labels.
    """
    content_start: Optional[int] = pydantic.Field(
        ...,
        description="The starting position within the content.",
        examples=[0]
    )
    content_end: Optional[int] = pydantic.Field(
        ...,
        description="The ending position within the content.",
        examples=[100]
    )

# ---------------------------------------------------------------------------- #


class PositionSchema(pydantic.BaseModel):
    """
    Schema for the position of an OCR fragment.
    """
    left: float = pydantic.Field(
        ...,
        description="The left coordinate in the image, "
                    "normalized to [0, 1].",
        examples=[0.1]
    )
    top: float = pydantic.Field(
        ...,
        description="The top coordinate in the image, "
                    "normalized to [0, 1].",
        examples=[0.1]
    )
    width: float = pydantic.Field(
        ...,
        description="The width in the image, "
                    "normalized to [0, 1].",
        examples=[0.8]
    )
    height: float = pydantic.Field(
        ...,
        description="The height in the image, "
                    "normalized to [0, 1].",
        examples=[0.2]
    )

# ---------------------------------------------------------------------------- #


class BlockLabelDataSchema(pydantic.BaseModel):
    """
    Schema for labels associated with a specific page in a document.
    """
    id: uuid.UUID = pydantic.Field(
        ...,
        description="The unique identifier for the OCR item (as a UUID4)."
    )
    labels: List[LabelDataSchema] = pydantic.Field(
        ...,
        description="List of labels associated with the block."
    )
    text_labels: List[TextLabelDataSchema] = pydantic.Field(
        ...,
        description="List of text labels associated with the block.",
    )
    position: PositionSchema = pydantic.Field(
        ...,
        description="Coordinates of the block in the image, "
                    "normalized to [0, 1]."
    )
    content: str = pydantic.Field(
        ...,
        description="Text content of the block."
    )

    @pydantic.field_serializer('id', when_used='always')
    def serialize_uuid(self, value: uuid.UUID, _info: Any) -> str:
        return str(value)

# ---------------------------------------------------------------------------- #


class PageLabelDataSchema(pydantic.BaseModel):
    """
    Schema for labels associated with a specific page in a document.
    """
    id: uuid.UUID = pydantic.Field(
        ...,
        description="The unique identifier for the OCR item (as a UUID4)."
    )
    page: int = pydantic.Field(
        ...,
        description="The page number in the document (starting from 1).",
        examples=[1]
    )
    labels: List[LabelDataSchema] = pydantic.Field(
        ...,
        description="List of labels associated with the page.",
    )
    blocks: List[BlockLabelDataSchema] = pydantic.Field(
        ...,
        description="List of labeled blocks on the page.",
    )

    @pydantic.field_serializer('id', when_used='always')
    def serialize_uuid(self, value: uuid.UUID, _info: Any) -> str:
        return str(value)

# ---------------------------------------------------------------------------- #


class DocumentLabelDataSchema(pydantic.BaseModel):
    """
    Schema for document labels.
    """
    labels: List[LabelDataSchema] = pydantic.Field(
        ...,
        description="List of labels associated with the document."
    )
    pages: List[PageLabelDataSchema] = pydantic.Field(
        ...,
        description="List of labeled pages in the document.",
    )

# ---------------------------------------------------------------------------- #
