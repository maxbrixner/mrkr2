# ---------------------------------------------------------------------------- #

import fastapi
# ---------------------------------------------------------------------------- #

import mrkr.services as services
import mrkr.schemas as schemas
import mrkr.crud as crud
import mrkr.database as database

# ---------------------------------------------------------------------------- #


router = fastapi.APIRouter(prefix="/document", tags=[schemas.Tags.document])

# ---------------------------------------------------------------------------- #


@router.get(
    "/{document_id}/label",
    summary="GUI to label a document",
    response_class=fastapi.responses.HTMLResponse
)
async def document_page(
    document_id: int,
    request: fastapi.Request,
    templates: services.TemplatesDependency,
    session: database.DatabaseDependency
) -> fastapi.responses.HTMLResponse:
    """
    GUI to label a document.
    """
    document = crud.get_document(
        session=session,
        id=document_id
    )

    if not document:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    return templates.TemplateResponse(
        "labeling.html",
        context={
            "request": request,
            "document": document
        }
    )

# ---------------------------------------------------------------------------- #
