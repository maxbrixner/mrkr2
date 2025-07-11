# ---------------------------------------------------------------------------- #

import pydantic
import enum
import datetime
from typing import Optional, List, Self

# ---------------------------------------------------------------------------- #


class FileProviderType(str, enum.Enum):
    """
    Enum for project file provider types.
    """
    local = "local"
    s3 = "s3"

# ---------------------------------------------------------------------------- #


class FileProviderConfig(pydantic.BaseModel):
    """
    Base configuration for a file provider.
    """
    path: str = pydantic.Field(
        ...,
        description="The path within ine file provider.",
    )
    pdf_dpi: int = pydantic.Field(
        default=200,
        description="The DPI (dots per inch) for the conversion of PDF files.",
    )

# ---------------------------------------------------------------------------- #


class FileProviderLocalConfig(FileProviderConfig):
    """
    Configuration for a local file provider.
    """
    pass

# ---------------------------------------------------------------------------- #


class FileProviderS3Config(FileProviderConfig):
    """
    Configuration for an AWS S3 file provider.
    """
    access_key: str = pydantic.Field(
        ...,
        description="The AWS access key for S3.",
    )
    account_id: str = pydantic.Field(
        ...,
        description="The AWS account ID for the S3 bucket.",
    )
    bucket: str = pydantic.Field(
        ...,
        description="The name of the S3 bucket.",
    )
    region: str = pydantic.Field(
        ...,
        description="The AWS region where the S3 bucket is located.",
    )
    role_name: str = pydantic.Field(
        ...,
        description="The AWS IAM role name for accessing the S3 bucket.",
    )
    secret_access_key: str = pydantic.Field(
        ...,
        description="The AWS secret access key for S3.",
    )


# ---------------------------------------------------------------------------- #


class ProjectFileProviderSchema(pydantic.BaseModel):
    """
    Schema for a project file provider.
    """
    type: FileProviderType = pydantic.Field(
        ...,
        description="The type of file provider for the project.",
    )
    config: FileProviderLocalConfig | FileProviderS3Config = pydantic.Field(
        ...,
        description="Configuration for the file provider.",
    )

# ---------------------------------------------------------------------------- #


class OcrProviderType(str, enum.Enum):
    """
    Enum for OCR provider types.
    """
    tesseract = "tesseract"
    textract = "textract"

# ---------------------------------------------------------------------------- #


class OcrProviderConfig(pydantic.BaseModel):
    """
    Base configuration for an OCR provider.
    """
    pass

# ---------------------------------------------------------------------------- #


class OcrProviderTesseractConfig(OcrProviderConfig):
    """
    Configuration for the Google Tesseract OCR provider.
    """
    language: str = pydantic.Field(
        default="eng",
        description="The language to use for OCR processing.",
    )

# ---------------------------------------------------------------------------- #


class OcrProviderTextractConfig(OcrProviderConfig):
    """
    Configuration for the AWS Textract OCR provider.
    """
    access_key: str = pydantic.Field(
        ...,
        description="The AWS access key for S3.",
    )
    account_id: str = pydantic.Field(
        ...,
        description="The AWS account ID for the S3 bucket.",
    )
    region: str = pydantic.Field(
        ...,
        description="The AWS region where the S3 bucket is located.",
    )
    role_name: str = pydantic.Field(
        ...,
        description="The AWS IAM role name for accessing the S3 bucket.",
    )
    secret_access_key: str = pydantic.Field(
        ...,
        description="The AWS secret access key for S3.",
    )

# ---------------------------------------------------------------------------- #


class ProjectOcrProviderSchema(pydantic.BaseModel):
    """
    Schema for a project file provider.
    """
    type: OcrProviderType = pydantic.Field(
        ...,
        description="The type of ocr provider for the project.",
    )
    config: OcrProviderTesseractConfig | OcrProviderTextractConfig = \
        pydantic.Field(
            ...,
            description="Configuration for the ocr provider.",
        )


# ---------------------------------------------------------------------------- #


class LabelType(str, enum.Enum):
    """
    Enum for label types.
    """
    classification_multiple = "classification_multiple"
    classification_single = "classification_single"
    text = "text"

# ---------------------------------------------------------------------------- #


class LabelTarget(str, enum.Enum):
    """
    Enum for label types.
    """
    document = "document"
    page = "page"
    block = "block"

# ---------------------------------------------------------------------------- #


class LabelDefinitionSchema(pydantic.BaseModel):
    """
    Schema for a label type in a project.
    """
    type: LabelType = pydantic.Field(
        ...,
        description="The type of label."
    )
    target: LabelTarget = pydantic.Field(
        ...,
        description="The target for the label (e.g. document, page, block).",
    )
    name: str = pydantic.Field(
        ...,
        min_length=1, max_length=50,
        description="The name of the label.",
    )
    color: str = pydantic.Field(
        pattern=r"^#(?:[0-9a-fA-F]{3}){1,2}$",
        description="The color of the label in hex format (starting with #)."
    )

    @pydantic.model_validator(mode='after')
    def check_type_target(self) -> Self:
        if self.type == LabelType.text and not self.target == LabelTarget.block:
            raise ValueError("Text labels can only be applied to blocks.")
        return self

# ---------------------------------------------------------------------------- #


class ProjectSchema(pydantic.BaseModel):
    """
    Schema for a project.
    """
    label_definitions: List[LabelDefinitionSchema] = pydantic.Field(
        ...,
        description="List of label definitions for the project."
    )
    file_provider: ProjectFileProviderSchema = pydantic.Field(
        ...,
        description="File provider for the project."
    )
    ocr_provider: ProjectOcrProviderSchema = pydantic.Field(
        ...,
        description="OCR provider for the project."
    )

# ---------------------------------------------------------------------------- #


class ProjectRetrieveSchema(pydantic.BaseModel):
    id: int = pydantic.Field(
        ...,
        description="The unique identifier of the project.",
        examples=[1]
    )
    name: str = pydantic.Field(
        ...,
        description="The name of the project.",
        examples=["My Project"]
    )
    created: datetime.datetime = pydantic.Field(
        ...,
        description="The timestamp when the project was created.",
        examples=["2023-10-01T12:00:00Z"]
    )
    updated: datetime.datetime = pydantic.Field(
        ...,
        description="The timestamp when the project was last updated.",
        examples=["2023-10-01T12:00:00Z"]
    )
    config: ProjectSchema = pydantic.Field(
        ...,
        description="Configuration for the project.",
        examples=[{
            "label_definitions": [
                    {
                        "type": "classification_single",
                        "target": "document",
                        "name": "Letter",
                        "color": "#4CAF50"
                    },
                {
                        "type": "classification_single",
                        "target": "document",
                        "name": "Email",
                        "color": "#2196F3"
                    },
                {
                        "type": "classification_multiple",
                        "target": "page",
                        "name": "Cover Page",
                        "color": "#FF9800"
                    },
                {
                        "type": "classification_multiple",
                        "target": "page",
                        "name": "Attachment",
                        "color": "#F44336"
                    },
                {
                        "type": "classification_multiple",
                        "target": "block",
                        "name": "Header",
                        "color": "#9C27B0"
                    },
                {
                        "type": "classification_multiple",
                        "target": "block",
                        "name": "Body",
                        "color": "#00BCD4"
                    },
                {
                        "type": "classification_multiple",
                        "target": "block",
                        "name": "Footer",
                        "color": "#FFEB3B"
                    },
                {
                        "type": "text",
                        "target": "block",
                        "name": "Name",
                        "color": "#607D8B"
                    },
                {
                        "type": "text",
                        "target": "block",
                        "name": "IBAN",
                        "color": "#8BC34A"
                    },
                {
                        "type": "text",
                        "target": "block",
                        "name": "Street",
                        "color": "#3F51B5"
                    }
            ],
            "file_provider": {
                "type": "local",
                "config": {
                    "path": "demo",
                    "pdf_dpi": 200
                }
            },
            "ocr_provider": {
                "type": "tesseract",
                "config": {
                    "language": "eng"
                }
            }}
        ]
    )


# ---------------------------------------------------------------------------- #

class ProjectCreateSchema(pydantic.BaseModel):
    """
    Schema for creating a new user.
    """
    name: str = pydantic.Field(
        ...,
        min_length=3, max_length=50,
        description="Project name must be between 3 and 50 characters.",
        examples=["My Project"]
    )
    config: ProjectSchema = pydantic.Field(
        ...,
        description="Configuration for the project.",
        examples=[{
            "label_definitions": [
                {
                    "type": "classification_single",
                    "target": "document",
                    "name": "Letter",
                    "color": "#4CAF50"
                },
                {
                    "type": "classification_single",
                    "target": "document",
                    "name": "Email",
                    "color": "#2196F3"
                },
                {
                    "type": "classification_multiple",
                    "target": "page",
                    "name": "Cover Page",
                    "color": "#FF9800"
                },
                {
                    "type": "classification_multiple",
                    "target": "page",
                    "name": "Attachment",
                    "color": "#F44336"
                },
                {
                    "type": "classification_multiple",
                    "target": "block",
                    "name": "Header",
                    "color": "#9C27B0"
                },
                {
                    "type": "classification_multiple",
                    "target": "block",
                    "name": "Body",
                    "color": "#00BCD4"
                },
                {
                    "type": "classification_multiple",
                    "target": "block",
                    "name": "Footer",
                    "color": "#FFEB3B"
                },
                {
                    "type": "text",
                    "target": "block",
                    "name": "Name",
                    "color": "#607D8B"
                },
                {
                    "type": "text",
                    "target": "block",
                    "name": "IBAN",
                    "color": "#8BC34A"
                },
                {
                    "type": "text",
                    "target": "block",
                    "name": "Street",
                    "color": "#3F51B5"
                }
            ],
            "file_provider": {
                "type": "local",
                "config": {
                    "path": "demo",
                    "pdf_dpi": 200
                }
            },
            "ocr_provider": {
                "type": "tesseract",
                "config": {
                    "language": "eng"
                }
            }
        }]
    )

# ---------------------------------------------------------------------------- #
