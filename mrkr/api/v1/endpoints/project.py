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


@router.get("/list-projects", summary="List Projects")
async def list_projects(
    session: database.DatabaseDependency,
    order_by: schemas.OrderBy = fastapi.Query(
        schemas.OrderBy.id,
        description="Field to order the projects by. Default is 'id'.",
        examples=["created", "id"]
    ),
    order: schemas.Order = fastapi.Query(
        schemas.Order.asc,
        description="Order direction, either 'asc' or 'desc'. Default is 'asc'.",
        examples=["asc"]
    ),
    limit: int = fastapi.Query(
        100,
        description="Maximum number of projects to return. Default is 100.",
        ge=1,
        examples=[50]
    ),
    offset: int = fastapi.Query(
        0,
        description="Number of projects to skip before starting to collect "
                    "the result set. Default is 0.",
        ge=0,
        examples=[10]
    ),
    filter: str = fastapi.Query(
        None,
        description="Filter projects. Default is None.",
        examples=["pdf"]
    )
) -> List[schemas.ProjectListSchema]:
    """
    List all documents in a project.
    """
    projects = crud.get_filtered_projects(
        session=session,
        order_by=order_by,
        order=order,
        limit=limit,
        offset=offset,
        filter=filter
    )

    result = []
    for project in projects:
        status = crud.get_project_status(
            session=session, id=project.id)

        project_schema = schemas.ProjectListSchema(**project.model_dump())

        project_schema.done = status[models.DocumentStatus.done]
        project_schema.open = status[models.DocumentStatus.open]
        project_schema.in_review = status[models.DocumentStatus.in_review]

        result.append(project_schema)

    return result

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
    ),
    order_by: schemas.OrderBy = fastapi.Query(
        schemas.OrderBy.id,
        description="Field to order the documents by. Default is 'id'.",
        examples=["created", "id"]
    ),
    order: schemas.Order = fastapi.Query(
        schemas.Order.asc,
        description="Order direction, either 'asc' or 'desc'. Default is 'asc'.",
        examples=["asc"]
    ),
    limit: int = fastapi.Query(
        100,
        description="Maximum number of documents to return. Default is 100.",
        ge=1,
        examples=[50]
    ),
    offset: int = fastapi.Query(
        0,
        description="Number of documents to skip before starting to collect "
                    "the result set. Default is 0.",
        ge=0,
        examples=[10]
    ),
    filter: str = fastapi.Query(
        None,
        description="Filter documents. Default is None.",
        examples=["pdf"]
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

    documents = crud.get_project_filtered_documents(
        session=session,
        project_id=project_id,
        order_by=order_by,
        order=order,
        limit=limit,
        offset=offset,
        filter=filter
    )

    return [schemas.DocumentListSchema(
        **document.model_dump()) for document in documents]

# ---------------------------------------------------------------------------- #
