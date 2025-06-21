# ---------------------------------------------------------------------------- #

import fastapi
from typing import Dict

# ---------------------------------------------------------------------------- #

import mrkr.schemas as schemas
import mrkr.crud as crud
import mrkr.database as database
import mrkr.providers as providers

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
async def project_scan(
    project_id: int,
    session: database.DatabaseDependency
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

    file_provider = providers.get_file_provider(
        project_config=project.config)

    async with file_provider("/") as provider:
        files = await provider.list()

        for file in files:
            crud.create_document(
                session=session,
                document=schemas.DocumentCreateSchema(
                    project_id=project.id,
                    path=file
                )
            )

    # Here you would implement the logic to scan the project
    # For now, we just return a success message
    return {
        "message": f"Project '{project.name}' scanned successfully.",
        "project_id": project.id
    }

# ---------------------------------------------------------------------------- #
