# ---------------------------------------------------------------------------- #

import fastapi
from typing import Dict

# ---------------------------------------------------------------------------- #

import mrkr.schemas as schemas
import mrkr.crud as crud
from mrkr.database import DatabaseDependency

# ---------------------------------------------------------------------------- #


router = fastapi.APIRouter(prefix="/project", tags=[schemas.Tags.project])

# ---------------------------------------------------------------------------- #


@router.post("/create", summary="Create Project")
async def user_create(
    project: schemas.ProjectCreateSchema,
    session: DatabaseDependency
) -> Dict:
    """
    Create a new project.
    """
    crud.create_project(session=session, project=project)
    return {"message": f"Project '{project.name}' created successfully."}

# ---------------------------------------------------------------------------- #
