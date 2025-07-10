# ---------------------------------------------------------------------------- #

import pydantic
import uuid
from typing import Any, List, Optional

# ---------------------------------------------------------------------------- #


class PageContentSchema(pydantic.BaseModel):
    content: str = pydantic.Field(
        ...,
        description="The content of the document page as a base64 encoded "
                    "image.")
    mime: str = pydantic.Field(
        ...,
        description="The MIME type of the content.",
        examples=["image/jpeg"])
    page: int = pydantic.Field(
        ...,
        description="The page number in the document (starting from 1).",
        examples=[1])


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


class PagePropertiesSchema(pydantic.BaseModel):
    aspect_ratio: float = pydantic.Field(
        ...,
        description="The aspect ratio of the page (width / height).",
        examples=[0.7066508])
    format: Optional[str] = pydantic.Field(
        default=None,
        description="The format of the image.",
        examples=["JPEG"])
    height: int = pydantic.Field(
        ...,
        description="The height of the page in pixels.",
        examples=[842])
    mode: str = pydantic.Field(
        ...,
        description="The color mode of the image (e.g., RGB).",
        examples=["RGB"])
    page: int = pydantic.Field(
        ...,
        description="The page number in the document (starting from 1).",
        examples=[1])
    width: int = pydantic.Field(
        ...,
        description="The width of the page in pixels.",
        examples=[595])

# ---------------------------------------------------------------------------- #


class BlockLabelDataSchema(pydantic.BaseModel):
    """
    Schema for labels associated with a specific page in a document.
    """
    id: uuid.UUID = pydantic.Field(
        ...,
        description="The unique identifier for the OCR item (as a UUID4)."
    )
    position: PositionSchema = pydantic.Field(
        ...,
        description="Coordinates of the block in the image, "
                    "normalized to [0, 1]."
    )
    labels: List[LabelSchema | TextLabelSchema] = pydantic.Field(
        ...,
        description="List of labels associated with the block."
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
        description="The page number in the document (starting from 1)."
    )
    properties: PagePropertiesSchema = pydantic.Field(
        ...,
        description="Metadata for the page, including aspect ratio, "
                    "format, height, mode, and width."
    )
    labels: List[LabelSchema] = pydantic.Field(
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
    labels: List[LabelSchema] = pydantic.Field(
        ...,
        description="List of labels associated with the document."
    )
    pages: List[PageLabelDataSchema] = pydantic.Field(
        ...,
        description="List of labeled pages in the document.",
    )

# ---------------------------------------------------------------------------- #


class DocumentCreateSchema(pydantic.BaseModel):
    """
    Schema for creating a new document.
    """
    project_id: int = pydantic.Field(
        ...,
        description="The ID of the project this document belongs to.",
        examples=[1]
    )
    path: str = pydantic.Field(
        ...,
        description="The path to the document file.",
        examples=["document1EN.pdf"]
    )

# ---------------------------------------------------------------------------- #
