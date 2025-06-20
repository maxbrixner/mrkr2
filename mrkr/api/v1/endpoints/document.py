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


@router.get("/document/{document_id}/metadata",
            summary="Get Document Metadata")
async def document_metadata(
    document_id: int,
    session: database.DatabaseDependency
) -> schemas.DocumentMetadataSchema:
    """
    Return the number of pages in the document.
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
        metadata = await provider.image_metadata

    return metadata

# ---------------------------------------------------------------------------- #


@router.get("/document/{document_id}/content",
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


@router.post("/document",
             summary="Create Document")
async def document_create(
    document: schemas.DocumentCreateSchema,
    session: database.DatabaseDependency
) -> Dict:
    """
    Create a new document.
    """
    crud.create_document(session=session, document=document)
    return {"message": f"Document '{document.path}' created successfully."}

# ---------------------------------------------------------------------------- #
