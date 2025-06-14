# ---------------------------------------------------------------------------- #

import sqlmodel

# ---------------------------------------------------------------------------- #

from mrkr.models.user import *
from mrkr.schemas.user import *

# ---------------------------------------------------------------------------- #


def create_user(session: sqlmodel.Session, user: UserCreateSchema) -> User:
    """
    Create a new user in the database.
    """
    database_user = User(
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
