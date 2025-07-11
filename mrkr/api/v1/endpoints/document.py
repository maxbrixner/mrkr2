# ---------------------------------------------------------------------------- #

import fastapi
from typing import Dict

# ---------------------------------------------------------------------------- #

import mrkr.schemas as schemas
import mrkr.crud as crud
import mrkr.models as models
import mrkr.providers as providers
import mrkr.database as database
import mrkr.services as services
import mrkr.core as core

# ---------------------------------------------------------------------------- #


router = fastapi.APIRouter(prefix="/document", tags=[schemas.Tags.document])

# ---------------------------------------------------------------------------- #


@router.get("/{document_id}",
            summary="Get Document")
async def get_document(
    document_id: int,
    session: database.DatabaseDependency
) -> schemas.DocumentRetrieveSchema:
    """
    Return the document from the database.
    """
    document = crud.get_document(session=session, id=document_id)

    if not document:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    document_schema = schemas.DocumentRetrieveSchema(**document.model_dump())

    return document_schema

# ---------------------------------------------------------------------------- #


@router.get("/content/{document_id}",
            summary="Get Document Content")
async def document_content(
    document_id: int,
    page: int,
    session: database.DatabaseDependency
) -> schemas.PageContentSchema:
    """
    Return the content of a specific page in the document as a json
    containing the images data as a base64 encoded byte string.
    """
    document = crud.get_document(session=session, id=document_id)

    if not document:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    file_provider = providers.get_file_provider(
        project_config=document.project.config)

    async with file_provider(document.path) as provider:
        image = await provider.read_as_base64_images(page=page, format="JPEG")

    return schemas.PageContentSchema(
        content=image[0],
        mime="image/jpeg",
        page=page
    )

# ---------------------------------------------------------------------------- #

# todo: cretae an update Schema for id+data


@router.put("/{document_id}/data",
            summary="Update Document Label Data")
async def document_submit_labeldata(
    document_id: int,
    data: schemas.DocumentLabelDataSchema,
    session: database.DatabaseDependency
) -> Dict:
    """
    Update the label data for the document.
    """
    document = crud.get_document(session=session, id=document_id)

    if not document:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    document.data = data.model_dump()

    session.add(document)
    session.commit()
    session.refresh(document)

    return {
        "message": "Label data updated successfully.",
    }

# ---------------------------------------------------------------------------- #

# todo: add schema for fields with examples


@router.post("/{document_id}/scan", summary="Scan Document")
async def scan_document(
    document_id: int,
    session: database.DatabaseDependency,
    worker: services.WorkerPoolDependency,
    force: bool = False,
) -> Dict:
    """
    Scan a project.
    """
    document = crud.get_document(session=session, id=document_id)

    if not document:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    worker.submit(
        core.scan_document_sync,
        document_id=document.id,
        force=force
    )

    return {
        "message": f"Scan scheduled for document {document_id}."
    }

# ---------------------------------------------------------------------------- #
