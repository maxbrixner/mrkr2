# ---------------------------------------------------------------------------- #

import fastapi
from typing import Dict

# ---------------------------------------------------------------------------- #

import mrkr.schemas as schemas
import mrkr.crud as crud
import mrkr.providers as providers
import mrkr.database as database

# ---------------------------------------------------------------------------- #


router = fastapi.APIRouter(prefix="/document", tags=[schemas.Tags.document])

# ---------------------------------------------------------------------------- #


@router.get("/metadata/{document_id}",
            summary="Get Document Metadata")
async def document_metadata(
    document_id: int,
    session: database.DatabaseDependency
) -> schemas.DocumentMetadataSchema:
    """
    Return the number of pages in the document along with some other metadata.
    """
    document = crud.get_document(session=session, id=document_id)

    if not document:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    if not document.metacontent:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail="Document metadata not found"
        )

    metadata = schemas.DocumentMetadataSchema(**document.metacontent)

    return metadata

# ---------------------------------------------------------------------------- #


@router.get("/labeldata/{document_id}",
            summary="Get Document Label Data")
async def document_labeldata(
    document_id: int,
    session: database.DatabaseDependency
) -> schemas.DocumentLabelDataSchema:
    """
    Return the label data for the document.
    """
    document = crud.get_document(session=session, id=document_id)

    if not document:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    if not document.labelcontent:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail="Document label data not found"
        )

    labeldata = schemas.DocumentLabelDataSchema(**document.labelcontent)

    return labeldata

# ---------------------------------------------------------------------------- #


@router.get("/content/{document_id}",
            summary="Get Document Content")
async def document_content(
    document_id: int,
    page: int,
    session: database.DatabaseDependency
) -> schemas.PageContentSchema:
    """
    Return the content of a specific page in the document.
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
