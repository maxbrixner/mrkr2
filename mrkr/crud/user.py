# ---------------------------------------------------------------------------- #

import sqlmodel
from typing import Sequence

# ---------------------------------------------------------------------------- #

import mrkr.models as models
import mrkr.schemas as schemas
import mrkr.services as services

# ---------------------------------------------------------------------------- #


def create_user(
    session: sqlmodel.Session,
    user: schemas.UserCreateSchema
) -> models.User:
    """
    Create a new user in the database.
    """
    database_user = models.User(
        username=user.username,
        email=user.email,
        password=services.hash_password(user.password),
        disabled=False
    )

    session.add(database_user)
    session.commit()
    session.refresh(database_user)
    return database_user

# ---------------------------------------------------------------------------- #


def list_users(
    session: sqlmodel.Session
) -> Sequence[models.User]:
    """
    List users in the database.
    """
    return session.exec(
        sqlmodel.select(models.User)
    ).all()

# ---------------------------------------------------------------------------- #
