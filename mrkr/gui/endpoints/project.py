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
    "/",
    summary="GUI to list all projects",
    response_class=fastapi.responses.HTMLResponse
)
async def projects_page(
    request: fastapi.Request,
    templates: services.TemplatesDependency,
    session: database.DatabaseDependency
) -> fastapi.responses.HTMLResponse:
    """
    GUI to list all projects.
    """
    # ...

    return templates.TemplateResponse(
        "projects.html",
        context={
            "request": request
        }
    )

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


@router.get(
    "/create",
    summary="GUI to create a new project",
    response_class=fastapi.responses.HTMLResponse
)
async def create_project_page(
    request: fastapi.Request,
    templates: services.TemplatesDependency,
    session: database.DatabaseDependency
) -> fastapi.responses.HTMLResponse:
    """
    GUI to list a project's documents.
    """
    return templates.TemplateResponse(
        "create_project.html",
        context={
            "request": request,
            "config_template": "hallo"
        }
    )

# ---------------------------------------------------------------------------- #


@router.get(
    "/{project_id}/edit",
    summary="GUI to edit an existing project",
    response_class=fastapi.responses.HTMLResponse
)
async def update_project_page(
    project_id: int,
    request: fastapi.Request,
    templates: services.TemplatesDependency,
    session: database.DatabaseDependency
) -> fastapi.responses.HTMLResponse:
    """
    GUI to update an existing project.
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
        "update_project.html",
        context={
            "request": request,
            "project": project
        }
    )

# ---------------------------------------------------------------------------- #
