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


@router.get("/{ocr_id}",
            summary="Get OCR")
async def ocr_retrieve(
    ocr_id: int,
    session: database.DatabaseDependency
) -> schemas.OcrResultSchema:
    """
    Return the OCR text of the document from the database.
    """
    # todo : this is wrong now
    # ocr = crud.get_ocr(session, ocr_id)

    # if not ocr:
    #    raise fastapi.HTTPException(
    #        status_code=fastapi.status.HTTP_404_NOT_FOUND,
    #        detail="OCR not found"
    #    )

    # return schemas.OcrResultSchema(**ocr.result)

    raise NotImplementedError
# ---------------------------------------------------------------------------- #
