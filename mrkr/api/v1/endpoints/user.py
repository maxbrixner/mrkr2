# ---------------------------------------------------------------------------- #

import fastapi
from typing import Dict

# ---------------------------------------------------------------------------- #

import mrkr.schemas as schemas
import mrkr.crud as crud
import mrkr.database as database

# ---------------------------------------------------------------------------- #


router = fastapi.APIRouter(prefix="/user", tags=[schemas.Tags.user])

# ---------------------------------------------------------------------------- #


@router.post("/login", summary="User Login")
async def user_login() -> None:
    """
    Login a user (not yet implemented).
    """
    raise NotImplementedError("Login not implemented yet.")

# ---------------------------------------------------------------------------- #


@router.post("/create", summary="Create User")
async def user_create(
    user: schemas.UserCreateSchema,
    session: database.DatabaseDependency
) -> Dict:
    """
    Create a new user.
    """
    crud.create_user(session=session, user=user)
    return {"message": f"User '{user.username}' created successfully."}

# ---------------------------------------------------------------------------- #
