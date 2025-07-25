# ---------------------------------------------------------------------------- #

import mrkr.schemas as schemas
from .file.base import BaseFileProvider
from .file.local import LocalFileProvider
from .file.s3 import S3FileProvider
from .ocr.base import BaseOcrProvider
from .ocr.tesseract import TesseractOcrProvider
from .ocr.textract import TextractOcrProvider

# ---------------------------------------------------------------------------- #


def get_file_provider(
    project_config: dict | schemas.ProjectConfigSchema
) -> BaseFileProvider:
    if isinstance(project_config, dict):
        project_config = schemas.ProjectConfigSchema(**project_config)

    match project_config.file_provider.type:
        case schemas.FileProviderType.local:
            if not isinstance(
                project_config.file_provider.config,
                schemas.FileProviderLocalConfigSchema
            ):
                raise ValueError(
                    "Local file provider was configured incorrectly."
                )

            return LocalFileProvider(
                config=project_config.file_provider.config)
        case schemas.FileProviderType.s3:
            if not isinstance(
                project_config.file_provider.config,
                schemas.FileProviderS3ConfigSchema
            ):
                raise ValueError(
                    "S3 file provider was configured incorrectly."
                )

            return S3FileProvider(
                config=project_config.file_provider.config)
        case _:
            raise ValueError(
                f"Unsupported file provider type: "
                f"{project_config.file_provider.type}"
            )

# ---------------------------------------------------------------------------- #


def get_ocr_provider(
    project_config: dict | schemas.ProjectConfigSchema
) -> BaseOcrProvider:
    if isinstance(project_config, dict):
        project_config = schemas.ProjectConfigSchema(**project_config)

    match project_config.ocr_provider.type:
        case schemas.OcrProviderType.tesseract:
            if not isinstance(
                project_config.ocr_provider.config,
                schemas.OcrProviderTesseractConfigSchema
            ):
                raise ValueError(
                    "Tesseract OCR provider was configured incorrectly."
                )

            return TesseractOcrProvider(
                config=project_config.ocr_provider.config)
        case schemas.OcrProviderType.textract:
            if not isinstance(
                project_config.ocr_provider.config,
                schemas.OcrProviderTextractConfigSchema
            ):
                raise ValueError(
                    "Textract OCR provider was configured incorrectly."
                )

            return TextractOcrProvider(
                config=project_config.ocr_provider.config)
        case _:
            raise ValueError(
                f"Unsupported ocr provider type: "
                f"{project_config.ocr_provider.type}"
            )

# ---------------------------------------------------------------------------- #
