# ---------------------------------------------------------------------------- #

import pydantic
import enum
import uuid
import datetime
from typing import Any, List, Optional

# ---------------------------------------------------------------------------- #

import mrkr.models as models

# ---------------------------------------------------------------------------- #


class LabelStatus(str, enum.Enum):
    """
    Enum for label status.
    """
    open = "open"
    done = "done"


# ---------------------------------------------------------------------------- #

class LabelSchema(pydantic.BaseModel):
    """
    Base schema for labels.
    """
    name: str = pydantic.Field(
        ...,
        description="The name of the label.",
        examples=[
            "Letter"
        ]
    )

# ---------------------------------------------------------------------------- #


class TextLabelSchema(LabelSchema):
    """
    Schema for text labels.
    """
    start: Optional[int] = pydantic.Field(
        ...,
        description="The starting position within the content.",
        examples=[
            5
        ]
    )
    end: Optional[int] = pydantic.Field(
        ...,
        description="The ending position within the content.",
        examples=[
            15
        ]
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
        examples=[0.4]
    )
    height: float = pydantic.Field(
        ...,
        description="The height in the image, "
                    "normalized to [0, 1].",
        examples=[0.4]
    )

# ---------------------------------------------------------------------------- #


class BlockLabelDataSchema(pydantic.BaseModel):
    """
    Schema for labels associated with a specific page in a document.
    """
    id: uuid.UUID = pydantic.Field(
        ...,
        description="The unique identifier for the OCR item (as a UUID4).",
        examples=["d33e6de2-379d-453f-bbd6-30bb9433563b"]
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
    label_status: LabelStatus = pydantic.Field(
        ...,
        description="The labeling status for the block.",
        examples=["done"]
    )
    content: str = pydantic.Field(
        ...,
        description="Text content of the block.",
        examples=["This is a sample text."]
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
        description="The unique identifier for the OCR item (as a UUID4).",
        examples=["d33e6de2-379d-453f-bbd6-30bb9433563b"]
    )
    page: int = pydantic.Field(
        ...,
        description="The page number in the document (starting from 1).",
        examples=[1]
    )
    labels: List[LabelSchema] = pydantic.Field(
        ...,
        description="List of labels associated with the page.",
    )
    label_status: LabelStatus = pydantic.Field(
        ...,
        description="The labeling status for the page.",
        examples=["done"]
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
    label_status: LabelStatus = pydantic.Field(
        ...,
        description="The labeling status for the document.",
        examples=["done"]
    )
    pages: List[PageLabelDataSchema] = pydantic.Field(
        ...,
        description="List of labeled pages in the document.",
    )

# ---------------------------------------------------------------------------- #


class GetDocumentSchema(pydantic.BaseModel):
    """
    API-Schema for document retrieval.
    """
    id: int = pydantic.Field(
        ...,
        description="The unique identifier for the document (as an integer).",
        examples=[1]
    )

# ---------------------------------------------------------------------------- #


class DocumentSchema(pydantic.BaseModel):
    """
    API-Schema for a document.
    """
    id: int = pydantic.Field(
        ...,
        description="The unique identifier for the document (as an integer).",
        examples=[1]
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
    status: models.DocumentStatus = pydantic.Field(
        ...,
        description="The status of the document.",
        examples=["open"]
    )
    data: DocumentLabelDataSchema = pydantic.Field(
        ...,
        description="The label data for the document",
    )

# ---------------------------------------------------------------------------- #


class DocumentListSchema(pydantic.BaseModel):
    """
    API-Schema for a list of documents, stripped of the labeling data.
    """
    id: int = pydantic.Field(
        ...,
        description="The unique identifier for the document (as an integer).",
        examples=[1]
    )
    path: str = pydantic.Field(
        ...,
        description="The path to the document file within its source.",
        examples=["/documents/my_document.pdf"]
    )
    status: models.DocumentStatus = pydantic.Field(
        ...,
        description="The status of the document.",
        examples=["open"]
    )
    assignee_name: Optional[str] = pydantic.Field(
        default=None,
        description="The name of the user assigned to this document.",
        examples=["John Doe"]
    )
    reviewer_name: Optional[str] = pydantic.Field(
        default=None,
        description="The name of the user reviewing this document.",
        examples=["Jane Smith"]
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


# ---------------------------------------------------------------------------- #


class PageContentSchema(pydantic.BaseModel):
    """
    API-Schema for a page's content as a base64 encoded image.
    """
    content: str = pydantic.Field(
        ...,
        description="The content of the document page as a base64 encoded "
                    "image.",
        examples=["iVBORw0KGgoAAAANSUhEUgAA..."]
    )
    page: int = pydantic.Field(
        ...,
        description="The page number in the document (starting from 1).",
        examples=[1]
    )
    width: int = pydantic.Field(
        ...,
        description="The width of the image in pixels.",
        examples=[800]
    )
    height: int = pydantic.Field(
        ...,
        description="The height of the image in pixels.",
        examples=[600]
    )
    aspect_ratio: float = pydantic.Field(
        ...,
        description="The aspect ratio of the image (width / height).",
        examples=[1.3333]
    )
    format: str = pydantic.Field(
        ...,
        description="The format of the image.",
        examples=["JPEG"]
    )
    mode: str = pydantic.Field(
        ...,
        description="The color mode of the image (e.g., RGB, CMYK).",
        examples=["RGB"]
    )


# ---------------------------------------------------------------------------- #


class UpdateDocumentLabelDataSchema(DocumentLabelDataSchema):
    """
    API-Schema for document data updates.
    """
    pass

# ---------------------------------------------------------------------------- #


class UpdateDocumentAssigneeSchema(pydantic.BaseModel):
    """
    API-Schema for document asignee updated.
    """
    document_ids: List[int] = pydantic.Field(
        ...,
        description="List of document IDs to update.",
        examples=[[1, 2, 3]]
    )
    assignee_id: Optional[int] = pydantic.Field(
        default=None,
        description="The ID of the user to assign to the documents.",
        examples=[1]
    )

# ---------------------------------------------------------------------------- #


class UpdateDocumentReviewerSchema(pydantic.BaseModel):
    """
    API-Schema for document reviewer updates.
    """
    document_ids: List[int] = pydantic.Field(
        ...,
        description="List of document IDs to update.",
        examples=[[1, 2, 3]]
    )
    reviewer_id: Optional[int] = pydantic.Field(
        default=None,
        description="The ID of the user to review to the documents.",
        examples=[1]
    )

# ---------------------------------------------------------------------------- #


class UpdateDocumentStatusSchema(pydantic.BaseModel):
    """
    API-Schema for document status updates.
    """
    document_ids: List[int] = pydantic.Field(
        ...,
        description="List of document IDs to update.",
        examples=[[1, 2, 3]]
    )
    status: models.DocumentStatusPublic = pydantic.Field(
        ...,
        description="The status of the document.",
        examples=["open"]
    )

# ---------------------------------------------------------------------------- #


class StatusListSchema(pydantic.BaseModel):
    """
    API-Schema for a list of document statuses.
    """
    name: str = pydantic.Field(
        ...,
        description="Name of the status."
    )
    value: str = pydantic.Field(
        ...,
        description="Value of the status."
    )

# ---------------------------------------------------------------------------- #
