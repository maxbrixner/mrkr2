# ---------------------------------------------------------------------------- #

import fastapi
from typing import Dict

# ---------------------------------------------------------------------------- #

import mrkr.schemas as schemas
import mrkr.crud as crud
import mrkr.database as database
import mrkr.services as services
import mrkr.core as core

# ---------------------------------------------------------------------------- #


router = fastapi.APIRouter(prefix="/project", tags=[schemas.Tags.project])

# ---------------------------------------------------------------------------- #


@router.post("/create", summary="Create Project")
async def project_create(
    project: schemas.ProjectCreateSchema,
    session: database.DatabaseDependency
) -> Dict:
    """
    Create a new project.
    """
    database_project = crud.create_project(session=session, project=project)
    return {
        "message": f"Project '{database_project.name}' created successfully.",
        "project_id": database_project.id
    }

# ---------------------------------------------------------------------------- #


@router.post("/scan/{project_id}", summary="Scan Project")
async def project_scan_schedule(
    project_id: int,
    session: database.DatabaseDependency,
    worker: services.WorkerPoolDependency,
    force: bool = False,
) -> Dict:
    """
    Scan a project.
    """
    project = crud.get_project(session=session, id=project_id)

    if not project:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    worker.submit(
        core.scan_project,
        project=project,
        force=force
    )

    return {
        "message": f"Scan scheduled for project {project_id}."
    }

# ---------------------------------------------------------------------------- #
