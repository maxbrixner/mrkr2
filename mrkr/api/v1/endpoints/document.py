# ---------------------------------------------------------------------------- #

import fastapi
from typing import Dict

# ---------------------------------------------------------------------------- #

import mrkr.schemas as schemas
import mrkr.crud as crud
from mrkr.database import DatabaseDependency
from mrkr.providers import LocalFileProvider, FileMetadata

# ---------------------------------------------------------------------------- #


router = fastapi.APIRouter(prefix="/document", tags=[schemas.Tags.user])

# ---------------------------------------------------------------------------- #


@router.get("/document/{document_id}/metadata",
            summary="Get Document Metadata")
async def document_metadata(document_id: int) -> FileMetadata:
    """
    Return the number of pages in the document.
    """
    with LocalFileProvider("demo/document1EN.pdf") as provider:
        metadata = provider.image_metadata

    return metadata

# ---------------------------------------------------------------------------- #
