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
    ocr = crud.get_ocr(session, ocr_id)

    if not ocr:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail="OCR not found"
        )

    return schemas.OcrResultSchema(**ocr.result)

# ---------------------------------------------------------------------------- #


@router.post("/run/{project_id}",
             summary="Schedule OCR")
async def ocr_schedule(
    project_id: int,
    session: database.DatabaseDependency
) -> Dict:
    """
    Schedule an OCR run for a project.
    """
    # todo: do this with a worker and a queue in postgres
    project = crud.get_project(session, project_id)

    if not project:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    file_provider = providers.get_file_provider(
        project_config=project.config)

    ocr_provider = providers.get_ocr_provider(
        project_config=project.config)

    for document in project.documents:
        async with file_provider(document.path) as provider:
            images = await provider.read_as_images()

            async with ocr_provider(images=images) as ocr_provider:
                ocr = await ocr_provider.ocr()

                crud.create_ocr(
                    session=session,
                    document=document,
                    ocr=ocr
                )

    return {
        "message": f"OCR scheduled for project {project_id}."
    }

# ---------------------------------------------------------------------------- #
