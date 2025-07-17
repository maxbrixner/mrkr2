# ---------------------------------------------------------------------------- #

import fastapi
from typing import Dict, List

# ---------------------------------------------------------------------------- #

import mrkr.schemas as schemas
import mrkr.crud as crud
import mrkr.models as models
import mrkr.database as database
import mrkr.services as services
import mrkr.core as core

# ---------------------------------------------------------------------------- #


router = fastapi.APIRouter(prefix="/project", tags=[schemas.Tags.project])

# ---------------------------------------------------------------------------- #


@router.post("", summary="Create Project")
async def create_project(
    session: database.DatabaseDependency,
    project: schemas.ProjectCreateSchema
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


@router.get("/{project_id}", summary="Get Project")
async def get_project(
    session: database.DatabaseDependency,
    project_id: int = fastapi.Path(
        ...,
        description="The unique identifier for the project (as an integer).",
        examples=[1]
    )
) -> schemas.ProjectSchema:
    """
    Retrieve a new project.
    """
    project = crud.get_project(session=session, id=project_id)

    if not project:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    project_schema = schemas.ProjectSchema(**project.model_dump())

    return project_schema


# ---------------------------------------------------------------------------- #


@router.post("/{project_id}/scan", summary="Scan Project")
async def scan_project(
    session: database.DatabaseDependency,
    worker: services.WorkerPoolDependency,
    project_id: int = fastapi.Path(
        ...,
        description="The unique identifier for the project (as an integer).",
        examples=[1]
    ),
    force: bool = False
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
        core.scan_project_sync,
        project_id=project.id,
        force=force
    )

    return {
        "message": f"Scan scheduled for project {project_id}."
    }

# ---------------------------------------------------------------------------- #


@router.get("/{project_id}/list-documents", summary="List Documents")
async def list_project_documents(
    session: database.DatabaseDependency,
    project_id: int = fastapi.Path(
        ...,
        description="The unique identifier for the project (as an integer).",
        examples=[1]
    )
) -> List[schemas.DocumentListSchema]:
    """
    List all documents in a project.
    """
    project = crud.get_project(session=session, id=project_id)

    if not project:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    documents = project.documents

    return [schemas.DocumentListSchema(**doc.model_dump()) for doc in documents]

# ---------------------------------------------------------------------------- #
