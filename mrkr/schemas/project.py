# ---------------------------------------------------------------------------- #

import pydantic
import enum
from typing import Optional

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
        examples=["demo"]
    )
    pdf_dpi: int = pydantic.Field(
        default=200,
        description="The DPI (dots per inch) for the conversion of PDF files.",
        examples=[200]
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
        examples=["EXAMPLEKEY"]
    )
    account_id: str = pydantic.Field(
        ...,
        description="The AWS account ID for the S3 bucket.",
        examples=["123456789012"]
    )
    bucket: str = pydantic.Field(
        ...,
        description="The name of the S3 bucket.",
        examples=["my-bucket"]
    )
    region: str = pydantic.Field(
        ...,
        description="The AWS region where the S3 bucket is located.",
        examples=["us-west-2"]
    )
    role_name: str = pydantic.Field(
        ...,
        description="The AWS IAM role name for accessing the S3 bucket.",
        examples=["my-role"]
    )
    secret_access_key: str = pydantic.Field(
        ...,
        description="The AWS secret access key for S3.",
        examples=["EXAMPLEKEY"]
    )


# ---------------------------------------------------------------------------- #


class ProjectFileProviderSchema(pydantic.BaseModel):
    """
    Schema for a project file provider.
    """
    type: FileProviderType = pydantic.Field(
        ...,
        description="The type of file provider for the project.",
        examples=["local", "s3"]
    )
    config: FileProviderLocalConfig | FileProviderS3Config = pydantic.Field(
        ...,
        description="Configuration for the file provider.",
        examples=[{"path": "demo", "pdf_dpi": 200}]
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
        examples=["eng", "deu"]
    )

# ---------------------------------------------------------------------------- #


class OcrProviderTextractConfig(OcrProviderConfig):
    """
    Configuration for the AWS Textract OCR provider.
    """
    access_key: str = pydantic.Field(
        ...,
        description="The AWS access key for S3.",
        examples=["EXAMPLEKEY"]
    )
    account_id: str = pydantic.Field(
        ...,
        description="The AWS account ID for the S3 bucket.",
        examples=["123456789012"]
    )
    region: str = pydantic.Field(
        ...,
        description="The AWS region where the S3 bucket is located.",
        examples=["us-west-2"]
    )
    role_name: str = pydantic.Field(
        ...,
        description="The AWS IAM role name for accessing the S3 bucket.",
        examples=["my-role"]
    )
    secret_access_key: str = pydantic.Field(
        ...,
        description="The AWS secret access key for S3.",
        examples=["EXAMPLEKEY"]
    )

# ---------------------------------------------------------------------------- #


class ProjectOcrProviderSchema(pydantic.BaseModel):
    """
    Schema for a project file provider.
    """
    type: OcrProviderType = pydantic.Field(
        ...,
        description="The type of ocr provider for the project.",
        examples=["tesseract", "textract"]
    )
    config: OcrProviderTesseractConfig | OcrProviderTextractConfig = \
        pydantic.Field(
            ...,
            description="Configuration for the ocr provider.",
            examples=[{"language": "eng"}]
        )

# ---------------------------------------------------------------------------- #


class LabelSetupType(str, enum.Enum):
    """
    Enum for label setup types.
    """
    blockwise = "blockwise"

# ---------------------------------------------------------------------------- #


class BaseLabelSetupConfigSchema(pydantic.BaseModel):
    pass

# ---------------------------------------------------------------------------- #


class BlockwiseLabelSetupConfig(BaseLabelSetupConfigSchema):
    pass

# ---------------------------------------------------------------------------- #


class ProjectLabelSetupSchema(pydantic.BaseModel):
    """
    Schema for the label setup of a project.
    """
    type: LabelSetupType = pydantic.Field(
        ...,
        description="The type of label setup.",
        examples=["blockwise"]
    )
    config: Optional[BlockwiseLabelSetupConfig] = pydantic.Field(
        ...,
        description="Configuration for the label setup.",
        examples=[{}]
    )

# ---------------------------------------------------------------------------- #


class ProjectSchema(pydantic.BaseModel):
    """
    Schema for a project.
    """
    label_setup: ProjectLabelSetupSchema = pydantic.Field(
        ...,
        description="Label setup configuration for the project.",
        examples=[
            {
                "type": "blockwise",
                "config": {}
            }
        ]
    )
    file_provider: ProjectFileProviderSchema = pydantic.Field(
        ...,
        description="File provider for the project.",
        examples=[
            {
                "type": "local",
                "config": {
                    "path": "demo",
                    "pdf_dpi": 200
                }
            }
        ]
    )
    ocr_provider: ProjectOcrProviderSchema = pydantic.Field(
        ...,
        description="OCR provider for the project.",
        examples=[
            {
                "type": "tesseract",
                "config": {
                    "language": "eng"
                }
            }
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
            "label_setup": {
                "type": "blockwise",
                "config": {}
            },
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
