# ---------------------------------------------------------------------------- #

import fastapi
from typing import Dict

# ---------------------------------------------------------------------------- #

import mrkr.schemas as schemas
import mrkr.crud as crud
import mrkr.database as database

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
    crud.create_project(session=session, project=project)
    return {"message": f"Project '{project.name}' created successfully."}

# ---------------------------------------------------------------------------- #
