# ---------------------------------------------------------------------------- #

import pydantic
import uuid
import datetime
from typing import Any, List, Optional

# ---------------------------------------------------------------------------- #


class LabelSchema(pydantic.BaseModel):
    """
    Base schema for labels.
    """
    name: str = pydantic.Field(
        ...,
        description="The name of the label.",
    )

# ---------------------------------------------------------------------------- #


class TextLabelSchema(LabelSchema):
    """
    Schema for text labels.
    """
    content_start: Optional[int] = pydantic.Field(
        ...,
        description="The starting position within the content.",
    )
    content_end: Optional[int] = pydantic.Field(
        ...,
        description="The ending position within the content.",
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
    )
    top: float = pydantic.Field(
        ...,
        description="The top coordinate in the image, "
                    "normalized to [0, 1].",
    )
    width: float = pydantic.Field(
        ...,
        description="The width in the image, "
                    "normalized to [0, 1].",
    )
    height: float = pydantic.Field(
        ...,
        description="The height in the image, "
                    "normalized to [0, 1].",
    )

# ---------------------------------------------------------------------------- #


class PagePropertiesSchema(pydantic.BaseModel):
    aspect_ratio: float = pydantic.Field(
        ...,
        description="The aspect ratio of the page (width / height)."
    )
    format: Optional[str] = pydantic.Field(
        default=None,
        description="The format of the image.",
    )
    height: int = pydantic.Field(
        ...,
        description="The height of the page in pixels.",
    )
    mode: str = pydantic.Field(
        ...,
        description="The color mode of the image (e.g., RGB).",
    )
    page: int = pydantic.Field(
        ...,
        description="The page number in the document (starting from 1).",
    )
    width: int = pydantic.Field(
        ...,
        description="The width of the page in pixels.",
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


class DocumentRetrieveSchema(pydantic.BaseModel):
    """
    Schema for retrieving document pages.
    """
    id: int = pydantic.Field(
        ...,
        description="The unique identifier for the document (as a UUID4)."
    )
    created: datetime.datetime = pydantic.Field(
        ...,
        description="The timestamp when the document was created.",
        examples=["2023-10-01T12:00:00Z"]
    )
    updated: datetime.datetime = pydantic.Field(
        ...,
        description="The timestamp when the document was last updated.",
        examples=["2023-10-01T12:00:00Z"]
    )
    path: str = pydantic.Field(
        ...,
        description="The path to the document file within its source.",
        examples=["/documents/my_document.pdf"]
    )
    # todo: update example data with real data
    data: DocumentLabelDataSchema = pydantic.Field(
        ...,
        description="The label data for the document",
        examples=[{
            "labels": [{"name": "Important"}],
            "pages": [
                {
                    "id": "123e4567-e89b-12d3-a456-426614174000",
                    "page": 1,
                    "properties": {
                        "aspect_ratio": 1.5,
                        "format": "JPEG",
                        "height": 1080,
                        "mode": "RGB",
                        "width": 1920
                    },
                    "labels": [{"name": "Header"}],
                    "blocks": [
                        {
                            "id": "123e4567-e89b-12d3-a456-426614174001",
                            "position": {
                                "left": 0.1,
                                "top": 0.2,
                                "width": 0.8,
                                "height": 0.2
                            },
                            "labels": [{"name": "Text Block"}],
                            "content": "This is a sample text block."
                        }
                    ]
                }
            ]
        }]





    )

# ---------------------------------------------------------------------------- #


class PageContentSchema(pydantic.BaseModel):
    content: str = pydantic.Field(
        ...,
        description="The content of the document page as a base64 encoded "
                    "image.",
        examples=["iVBORw0KGgoAAAANSUhEUgAA..."]
    )
    mime: str = pydantic.Field(
        ...,
        description="The MIME type of the content.",
        examples=["image/jpeg"]
    )
    page: int = pydantic.Field(
        ...,
        description="The page number in the document (starting from 1).",
        examples=[1]
    )


# ---------------------------------------------------------------------------- #
