# ---------------------------------------------------------------------------- #

import sqlmodel

# ---------------------------------------------------------------------------- #

import mrkr.models as models
import mrkr.schemas as schemas

# ---------------------------------------------------------------------------- #


def create_project(
    session: sqlmodel.Session,
    project: schemas.ProjectCreateSchema
) -> models.Project:
    """
    Create a new user in the database.
    """
    database_project = models.Project(
        name=project.name,
        config=project.config.model_dump(),
    )

    session.add(database_project)
    session.commit()
    session.refresh(database_project)
    return database_project

# ---------------------------------------------------------------------------- #


def get_project(
    session: sqlmodel.Session,
    id: int
) -> models.Project | None:
    """
    Retrieve a project from the database by its ID.
    """
    return session.get(models.Project, id)

# ---------------------------------------------------------------------------- #
