# ---------------------------------------------------------------------------- #

import fastapi
import asyncio
from typing import Dict

# ---------------------------------------------------------------------------- #

import mrkr.schemas as schemas
import mrkr.crud as crud
import mrkr.providers as providers
import mrkr.database as database
# ---------------------------------------------------------------------------- #


router = fastapi.APIRouter(prefix="/ocr", tags=[schemas.Tags.ocr])

# ---------------------------------------------------------------------------- #


@router.get("/ocr/{ocr_id}",
            summary="Get OCR")
async def ocr(
    ocr_id: int,
    session: database.DatabaseDependency
) -> schemas.OcrResultSchema:
    """
    Return the OCR text of the document.
    """

    """
    document = crud.get_document(session, 1)

    if not document:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    file_provider = providers.get_file_provider(
        project_config=document.project.config)

    ocr_provider = providers.get_ocr_provider(
        project_config=document.project.config)

    async with file_provider(document.path) as provider:
        images = await provider.read_as_images()

        async with ocr_provider(images=images) as ocr_provider:
            ocr = await ocr_provider.ocr()

    if not document:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    crud.create_ocr(
        session=session,
        document=document,
        ocr=ocr
    )
    """

    ocr = crud.get_ocr(session, ocr_id)

    if not ocr:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail="OCR not found"
        )

    return schemas.OcrResultSchema(**ocr.result)

# ---------------------------------------------------------------------------- #
