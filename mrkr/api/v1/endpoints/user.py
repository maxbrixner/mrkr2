# ---------------------------------------------------------------------------- #

import fastapi
from typing import Dict, List

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


@router.post("", summary="Create User")
async def user_create(
    user: schemas.UserCreateSchema,
    session: database.DatabaseDependency
) -> Dict:
    """
    Create a new user.
    """
    database_user = crud.create_user(session=session, user=user)
    return {
        "message": f"User '{user.username}' created successfully.",
        "user_id": database_user.id
    }

# ---------------------------------------------------------------------------- #


@router.get("/list-users", summary="List Users")
async def list_users(
    session: database.DatabaseDependency
) -> List[schemas.UserListSchema]:
    """
    List all users.
    """
    users = crud.list_users(session=session)
    return [schemas.UserListSchema(**user.model_dump()) for user in users]

# ---------------------------------------------------------------------------- #
