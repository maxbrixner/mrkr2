# ---------------------------------------------------------------------------- #

import fastapi
# ---------------------------------------------------------------------------- #

import mrkr.services as services
import mrkr.schemas as schemas
import mrkr.crud as crud
import mrkr.database as database

# ---------------------------------------------------------------------------- #


router = fastapi.APIRouter(prefix="/project", tags=[schemas.Tags.project])

# ---------------------------------------------------------------------------- #


@router.get(
    "/{project_id}/documents",
    summary="GUI to list a project's documents",
    response_class=fastapi.responses.HTMLResponse
)
async def project_documents_page(
    project_id: int,
    request: fastapi.Request,
    templates: services.TemplatesDependency,
    session: database.DatabaseDependency
) -> fastapi.responses.HTMLResponse:
    """
    GUI to list a project's documents.
    """
    project = crud.get_project(
        session=session,
        id=project_id
    )

    if not project:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    return templates.TemplateResponse(
        "project.html",
        context={
            "request": request,
            "project": project
        }
    )

# ---------------------------------------------------------------------------- #
