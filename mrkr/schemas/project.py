# ---------------------------------------------------------------------------- #

import pydantic
import enum
from typing import List

# ---------------------------------------------------------------------------- #


class FileProviderType(str, enum.Enum):
    """
    Enum for project file provider types.
    """
    local = "local"
    s3 = "s3"

# ---------------------------------------------------------------------------- #


class FileProviderLocalConfig(pydantic.BaseModel):
    """
    Configuration for a local file provider.
    """
    folder: str = pydantic.Field(
        ...,
        description="The local folder where files are stored.",
        examples=["/demo"]
    )

# ---------------------------------------------------------------------------- #


class FileProviderS3Config(pydantic.BaseModel):
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
    suffix: str = pydantic.Field(
        ...,
        description="The suffix for the S3 bucket.",
        examples=["/demo"]
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
        examples=[{"folder": "/demo"}]
    )

# ---------------------------------------------------------------------------- #


class OcrProviderType(str, enum.Enum):
    """
    Enum for OCR provider types.
    """
    tesseract = "tesseract"
    textract = "textract"

# ---------------------------------------------------------------------------- #


class OcrProviderTesseractConfig(pydantic.BaseModel):
    """
    Configuration for the Google Tesseract OCR provider.
    """
    language: str = pydantic.Field(
        default="eng",
        description="The language to use for OCR processing.",
        examples=["eng", "deu"]
    )

# ---------------------------------------------------------------------------- #


class OcrProviderTextractConfig(pydantic.BaseModel):
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


class ProjectSchema(pydantic.BaseModel):
    """
    Schema for a project.
    """
    file_provider: ProjectFileProviderSchema = pydantic.Field(
        ...,
        description="File provider for the project.",
        examples=[
            {
                "type": "local",
                "config": {
                    "alias": "local_provider",
                    "folder": "/demo"
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
            "file_provider": {
                    "type": "local",
                    "config": {
                        "alias": "local_provider",
                        "folder": "/demo"
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
