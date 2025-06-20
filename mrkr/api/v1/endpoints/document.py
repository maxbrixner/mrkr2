# ---------------------------------------------------------------------------- #

import fastapi
import asyncio
from typing import Dict

# ---------------------------------------------------------------------------- #

import mrkr.schemas as schemas
import mrkr.crud as crud
import mrkr.providers as providers
from mrkr.database import DatabaseDependency

# ---------------------------------------------------------------------------- #


router = fastapi.APIRouter(prefix="/document", tags=[schemas.Tags.document])

# ---------------------------------------------------------------------------- #


@router.get("/document/{document_id}/metadata",
            summary="Get Document Metadata")
async def document_metadata(document_id: int) -> schemas.DocumentMetadataSchema:
    """
    Return the number of pages in the document.
    """
    async with providers.LocalFileProvider("demo/document1EN.pdf") as provider:
        metadata = await provider.image_metadata

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
    async with providers.LocalFileProvider("demo/document1EN.pdf") as provider:
        image = await provider.read_as_base64_images(page=page, format="JPEG")

    # todo: remove this artificial delay
    if page == 2:
        import asyncio
        await asyncio.sleep(3)

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
    session: DatabaseDependency
) -> schemas.OcrResultSchema:
    """
    Return the OCR text of the document.
    """
    async with providers.LocalFileProvider("demo/document1EN.pdf") as provider:
        images = await provider.read_as_images()

        async with providers.TesseractOcrProvider(
                images=images) as ocr_provider:
            ocr = await ocr_provider.ocr()

    return ocr

# ---------------------------------------------------------------------------- #
