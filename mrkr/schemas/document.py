# ---------------------------------------------------------------------------- #

import pydantic
from typing import List, Optional

# ---------------------------------------------------------------------------- #


class PageMetadataSchema(pydantic.BaseModel):
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


class DocumentMetadataSchema(pydantic.BaseModel):
    pages: List[PageMetadataSchema] = pydantic.Field(
        ...,
        description="Metadata for each page in the document.",
        examples=[
            [
                {
                    "aspect_ratio": 0.7066508,
                    "page": 1,
                    "width": 595,
                    "height": 842,
                    "format": "JPEG",
                    "mode": "RGB"
                },
                {
                    "aspect_ratio": 0.7066508,
                    "page": 2,
                    "width": 595,
                    "height": 842,
                    "format": "JPEG",
                    "mode": "RGB"
                }
            ]
        ])
    path: str = pydantic.Field(
        ...,
        description="The path to the file.",
        examples=["document1EN.pdf"])

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
