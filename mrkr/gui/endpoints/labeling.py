# ---------------------------------------------------------------------------- #

import fastapi
# ---------------------------------------------------------------------------- #

import mrkr.services as services
import mrkr.schemas as schemas
import mrkr.crud as crud
import mrkr.database as database

# ---------------------------------------------------------------------------- #


router = fastapi.APIRouter(tags=[schemas.Tags.labeling])

# ---------------------------------------------------------------------------- #


@router.get(
    "/label/{document_id}",
    summary="Label a document",
    response_class=fastapi.responses.HTMLResponse
)
async def label(
    document_id: int,
    request: fastapi.Request,
    templates: services.TemplatesDependency,
    session: database.DatabaseDependency
) -> fastapi.responses.HTMLResponse:
    """
    GUI to label a file.
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

    current_ocr_id = crud.get_current_ocr_id(
        session=session,
        document=document
    )

    return templates.TemplateResponse(
        "labeling.html",
        context={
            "request": request,
            "document": document,
            "ocr_id": current_ocr_id
        }
    )

# ---------------------------------------------------------------------------- #
