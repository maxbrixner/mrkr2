# ---------------------------------------------------------------------------- #

import pydantic
import uuid
from typing import Optional, List

# ---------------------------------------------------------------------------- #


class LabelSchema(pydantic.BaseModel):
    """
    Base schema for labels.
    """
    name: str = pydantic.Field(
        ...,
        description="The name of the label.",
        examples=["Customer Letter"]
    )

# ---------------------------------------------------------------------------- #


class TextLabelSchema(LabelSchema):
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


class BlockLabelSchema(pydantic.BaseModel):
    """
    Schema for labels associated with a specific page in a document.
    """
    ocr_item_id: uuid.UUID = pydantic.Field(
        ...,
        description="The unique identifier for the OCR item (as a UUID4)."
    )
    labels: List[LabelSchema] = pydantic.Field(
        ...,
        description="List of labels associated with the block."
    )
    text_labels: List[TextLabelSchema] = pydantic.Field(
        ...,
        description="List of text labels associated with the block.",
    )
    content: str = pydantic.Field(
        ...,
        description="Text content of the block."
    )

# ---------------------------------------------------------------------------- #


class PageLabelSchema(pydantic.BaseModel):
    """
    Schema for labels associated with a specific page in a document.
    """
    page: int = pydantic.Field(
        ...,
        description="The page number in the document (starting from 1).",
        examples=[1]
    )
    labels: List[LabelSchema] = pydantic.Field(
        ...,
        description="List of labels associated with the page.",
    )
    blocks: List[BlockLabelSchema] = pydantic.Field(
        ...,
        description="List of labeled blocks on the page.",
    )

# ---------------------------------------------------------------------------- #


class DocumentLabelSchema(pydantic.BaseModel):
    """
    Schema for document labels.
    """
    labels: List[LabelSchema] = pydantic.Field(
        ...,
        description="List of labels associated with the document."
    )
    pages: List[PageLabelSchema] = pydantic.Field(
        ...,
        description="List of labeled pages in the document.",
    )

# ---------------------------------------------------------------------------- #
