# ---------------------------------------------------------------------------- #

import sqlmodel

# ---------------------------------------------------------------------------- #

import mrkr.models as models
import mrkr.schemas as schemas

# ---------------------------------------------------------------------------- #


def create_user(
    session: sqlmodel.Session,
    user: schemas.UserCreateSchema
) -> models.User:
    """
    Create a new user in the database.
    """
    # todo: hash password
    database_user = models.User(
        username=user.username,
        email=user.email,
        password=user.password,
        disabled=False
    )

    session.add(database_user)
    session.commit()
    session.refresh(database_user)
    return database_user

# ---------------------------------------------------------------------------- #
