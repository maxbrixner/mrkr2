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


router = fastapi.APIRouter(prefix="/ocr", tags=[schemas.Tags.ocr])

# ---------------------------------------------------------------------------- #


@router.get("/ocr/{ocr_id}",
            summary="Get OCR")
async def ocr(
    ocr_id: int,
    session: DatabaseDependency
) -> schemas.OcrResultSchema:
    """
    Return the OCR text of the document.
    """
    # async with providers.LocalFileProvider("demo/document1EN.pdf") as provider:
    #    images = await provider.read_as_images()#
    #
    #    async with providers.TesseractOcrProvider(
    #            images=images) as ocr_provider:
    #        ocr = await ocr_provider.ocr()

    # document = crud.get_document(session, 2)

    # if not document:
    #    raise fastapi.HTTPException(
    #        status_code=fastapi.status.HTTP_404_NOT_FOUND,
    #        detail="Document not found"
    #    )

    # crud.create_ocr(
    #    session=session,
    #    document=document,
    #    ocr=ocr
    # )

    ocr = crud.get_ocr(session, ocr_id)

    if not ocr:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail="OCR not found"
        )

    return schemas.OcrResultSchema(**ocr.result)

# ---------------------------------------------------------------------------- #
