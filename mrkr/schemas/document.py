# ---------------------------------------------------------------------------- #

import pydantic
import enum
import uuid
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


class FileMetadataSchema(pydantic.BaseModel):
    pages: List[PageMetadataSchema] = pydantic.Field(
        ...,
        description="Metadata for each page in the file.",
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
        examples=["/path/to/document.pdf"])

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


class OcrBlockType(str, enum.Enum):
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
        description="The ID of the related OCR block (as a UUID4).",
        examples=["123e4567-e89b-12d3-a456-426614174000"]
    )

# ---------------------------------------------------------------------------- #


class OcrBlockSchema(pydantic.BaseModel):
    id: uuid.UUID = pydantic.Field(
        ...,
        description="The unique identifier for the OCR block (as a UUID4).",
        examples=["123e4567-e89b-12d3-a456-426614174000"]
    )
    type: OcrBlockType = pydantic.Field(
        ...,
        description="The type of the OCR block.",
        examples=["page"]
    )
    left: float = pydantic.Field(
        ...,
        description="The left coordinate of the block in the image, "
                    "normalized to [0, 1].",
        examples=[0.1]
    )
    top: float = pydantic.Field(
        ...,
        description="The top coordinate of the block in the image, "
                    "normalized to [0, 1].",
        examples=[0.1]
    )
    width: float = pydantic.Field(
        ...,
        description="The width of the block in the image, "
                    "normalized to [0, 1].",
        examples=[0.8]
    )
    height: float = pydantic.Field(
        ...,
        description="The height of the block in the image, "
                    "normalized to [0, 1].",
        examples=[0.2]
    )
    confidence: Optional[float] = pydantic.Field(
        None,
        description="The confidence score of the OCR block as a percentage",
        examples=[95]
    )
    content: Optional[str] = pydantic.Field(
        None,
        description="The text content of the OCR block.",
        examples=["Test content"]
    )
    relationships: List[OcrRelationshipSchema] = pydantic.Field(
        [],
        description="A list of relationships to other OCR blocks.",
        examples=[
            {
                "type": "child",
                "id": "123e4567-e89b-12d3-a456-426614174000"
            }
        ]
    )

# ---------------------------------------------------------------------------- #


class OcrResultSchema(pydantic.BaseModel):
    blocks: List[OcrBlockSchema] = pydantic.Field(
        ...,
        description="A list of OCR blocks extracted from the document.",
        examples=[
            {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "type": "page",
                "left": 0.1,
                "top": 0.1,
                "width": 0.8,
                "height": 0.2,
                "confidence": 95,
                "content": "Test content",
                "relationships": []
            }
        ]
    )

# ---------------------------------------------------------------------------- #
