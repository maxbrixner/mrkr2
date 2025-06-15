# ---------------------------------------------------------------------------- #

import fastapi
# ---------------------------------------------------------------------------- #

import mrkr.services as services
import mrkr.schemas as schemas

# ---------------------------------------------------------------------------- #


router = fastapi.APIRouter(tags=[schemas.Tags.labeling])

# ---------------------------------------------------------------------------- #


@router.get(
    "/label",
    summary="Label a file",
    response_class=fastapi.responses.HTMLResponse
)
async def label(
    request: fastapi.Request,
    templates: services.TemplatesDependency
) -> fastapi.responses.HTMLResponse:
    """
    GUI to label a file.
    """
    return templates.TemplateResponse(
        "labeling.html",
        context={
            "request": request,
            "project": "Project #1",
            "task": "Task #1",
        }
    )

# ---------------------------------------------------------------------------- #
