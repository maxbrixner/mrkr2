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
