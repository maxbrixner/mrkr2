# ---------------------------------------------------------------------------- #

import pydantic
import enum
import datetime
from typing import Optional, List, Self

# ---------------------------------------------------------------------------- #


class AwsConfigSchema(pydantic.BaseModel):
    """
    Base configuration schema for AWS via boto3.
    """
    aws_access_key_id: str = pydantic.Field(
        ...,
        description="The AWS access key for S3.",
        examples=["AKIAIOSFODNN7EXAMPLE"]
    )
    aws_account_id: str = pydantic.Field(
        ...,
        description="The AWS account ID for the S3 bucket.",
        examples=["123456789012"]
    )
    aws_region_name: str = pydantic.Field(
        ...,
        description="The AWS region where the S3 bucket is located.",
        examples=["us-west-2"]
    )
    aws_role_name: str = pydantic.Field(
        ...,
        description="The AWS IAM role name for accessing the S3 bucket.",
        examples=["S3AccessRole"]
    )
    aws_secret_access_key: str = pydantic.Field(
        ...,
        description="The AWS secret access key for S3.",
        examples=["wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"]
    )


# ---------------------------------------------------------------------------- #


class AwsS3ConfigSchema(AwsConfigSchema):
    """
    Base configuration schema for AWS S3 via boto3.
    """
    aws_bucket_name: str = pydantic.Field(
        ...,
        description="The name of the S3 bucket.",
        examples=["my-s3-bucket"]
    )

# ---------------------------------------------------------------------------- #


class FileProviderType(str, enum.Enum):
    """
    Enum for project file provider types.
    """
    local = "local"
    s3 = "s3"

# ---------------------------------------------------------------------------- #


class FileProviderConfigSchema(pydantic.BaseModel):
    """
    Base configuration for a file provider.
    """
    path: str = pydantic.Field(
        ...,
        description="The path within ine file provider.",
        examples=["/path/to/files"]
    )
    pdf_dpi: int = pydantic.Field(
        default=200,
        description="The DPI (dots per inch) for the conversion of PDF files.",
        examples=[200]
    )
    image_format: str = pydantic.Field(
        default="JPEG",
        description="The image format to use when converting PDF files.",
        examples=["JPEG"]
    )

# ---------------------------------------------------------------------------- #


class FileProviderLocalConfigSchema(FileProviderConfigSchema):
    """
    Configuration for a local file provider.
    """
    bucket_name: str = pydantic.Field(
        default="JPEG",
        description="The image format to use when converting PDF files.",
        examples=["JPEG"]
    )

# ---------------------------------------------------------------------------- #


class FileProviderS3ConfigSchema(FileProviderConfigSchema, AwsS3ConfigSchema):
    """
    Configuration for an AWS S3 file provider.
    """
    pass

# ---------------------------------------------------------------------------- #


class ProjectFileProviderSchema(pydantic.BaseModel):
    """
    Schema for a project file provider.
    """
    type: FileProviderType = pydantic.Field(
        ...,
        description="The type of file provider for the project.",
        examples=["local"]
    )
    config: FileProviderLocalConfigSchema | \
        FileProviderS3ConfigSchema = pydantic.Field(
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


class OcrProviderConfigSchema(pydantic.BaseModel):
    """
    Base configuration for an OCR provider.
    """
    pass

# ---------------------------------------------------------------------------- #


class OcrProviderTesseractConfigSchema(OcrProviderConfigSchema):
    """
    Configuration for the Google Tesseract OCR provider.
    """
    language: str = pydantic.Field(
        default="eng",
        description="The language to use for OCR processing.",
        examples=["eng"]
    )

# ---------------------------------------------------------------------------- #


class OcrProviderTextractConfigSchema(OcrProviderConfigSchema):
    """
    Configuration for the AWS Textract OCR provider.
    """
    access_key: str = pydantic.Field(
        ...,
        description="The AWS access key for S3.",
        examples=["AKIAIOSFODNN7EXAMPLE"]
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
        examples=["TextractRole"]
    )
    secret_access_key: str = pydantic.Field(
        ...,
        description="The AWS secret access key for S3.",
        examples=["wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"]
    )

# ---------------------------------------------------------------------------- #


class ProjectOcrProviderSchema(pydantic.BaseModel):
    """
    Schema for a project file provider.
    """
    type: OcrProviderType = pydantic.Field(
        ...,
        description="The type of ocr provider for the project.",
        examples=["tesseract"]
    )
    config: OcrProviderTesseractConfigSchema | \
        OcrProviderTextractConfigSchema = pydantic.Field(
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
        description="The type of label.",
        examples=["classification_single"]
    )
    target: LabelTarget = pydantic.Field(
        ...,
        description="The target for the label (e.g. document, page, block).",
        examples=["document"]
    )
    name: str = pydantic.Field(
        ...,
        min_length=1, max_length=50,
        description="The name of the label.",
        examples=["Letter"]
    )
    color: str = pydantic.Field(
        pattern=r"^#(?:[0-9a-fA-F]{3}){1,2}$",
        description="The color of the label in hex format (starting with #).",
        examples=["#4CAF50"]
    )

    @pydantic.model_validator(mode='after')
    def check_type_target(self) -> Self:
        if self.type == LabelType.text and not self.target == LabelTarget.block:
            raise ValueError("Text labels can only be applied to blocks.")
        return self

# ---------------------------------------------------------------------------- #


class ProjectConfigSchema(pydantic.BaseModel):
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


class ProjectSchema(pydantic.BaseModel):
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
    config: ProjectConfigSchema = pydantic.Field(
        ...,
        description="Configuration for the project."
    )


# ---------------------------------------------------------------------------- #


class UpdateProjectNameSchema(pydantic.BaseModel):
    """
    API-Schema for updating a project's name.
    """
    name: str = pydantic.Field(
        ...,
        description="The new name for the project.",
        examples=["My Project"]
    )

# ---------------------------------------------------------------------------- #


class ProjectListSchema(pydantic.BaseModel):
    """
    API-Schema for a list of projects, stripped of the configuration.
    """
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
    done: int = pydantic.Field(
        default=0,
        description="The number of documents in the project that are done.",
        examples=[10]
    )
    open: int = pydantic.Field(
        default=0,
        description="The number of documents in the project that are open.",
        examples=[5]
    )
    review: int = pydantic.Field(
        default=0,
        description="The number of documents in the project that are in review.",
        examples=[2]
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
    config: ProjectConfigSchema = pydantic.Field(
        ...,
        description="Configuration for the project."
    )

# ---------------------------------------------------------------------------- #


class OrderBy(str, enum.Enum):
    """
    Enum for ordering fields.
    """
    id = "id"
    created = "created"
    updated = "updated"

# ---------------------------------------------------------------------------- #


class Order(str, enum.Enum):
    """
    Enum for ordering fields.
    """
    asc = "asc"
    desc = "desc"

# ---------------------------------------------------------------------------- #
