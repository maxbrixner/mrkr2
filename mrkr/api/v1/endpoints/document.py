# ---------------------------------------------------------------------------- #

import fastapi
from typing import Dict

# ---------------------------------------------------------------------------- #

import mrkr.schemas as schemas
import mrkr.crud as crud
import mrkr.providers as providers

# ---------------------------------------------------------------------------- #


router = fastapi.APIRouter(prefix="/document", tags=[schemas.Tags.document])

# ---------------------------------------------------------------------------- #


@router.get("/document/{document_id}/metadata",
            summary="Get Document Metadata")
async def document_metadata(document_id: int) -> schemas.FileMetadataSchema:
    """
    Return the number of pages in the document.
    """
    with providers.LocalFileProvider("demo/document1EN.pdf") as provider:
        metadata = provider.image_metadata

    return metadata

# ---------------------------------------------------------------------------- #


@router.get("/document/{document_id}/content",
            summary="Get Document Content")
async def document_content(
    document_id: int,
    page: int
) -> schemas.PageContentSchema:
    """
    Return the content of a specific page in the document.
    """
    with providers.LocalFileProvider("demo/document1EN.pdf") as provider:
        image = provider.read_as_base64_images(page=page, format="JPEG")

    return schemas.PageContentSchema(
        content=image[0],
        mime="image/jpeg",
        page=page
    )

# ---------------------------------------------------------------------------- #


@router.get("/document/{document_id}/ocr",
            summary="Get Document OCR")
async def document_ocr(
    document_id: int,
) -> schemas.OcrResultSchema:
    """
    Return the OCR text of the document.
    """
    with providers.LocalFileProvider("demo/document1EN.pdf") as provider:
        image = provider.read_as_images()

        with providers.TesseractOcrProvider(images=image[0]) as ocr_provider:
            ocr = ocr_provider.ocr()

    return ocr

# ---------------------------------------------------------------------------- #
