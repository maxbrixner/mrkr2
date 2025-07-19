# ---------------------------------------------------------------------------- #

import sqlmodel
from typing import Sequence

# ---------------------------------------------------------------------------- #

import mrkr.models as models
import mrkr.schemas as schemas

# ---------------------------------------------------------------------------- #


def get_projects(
    session: sqlmodel.Session
) -> Sequence[models.Project]:
    """
    Retrieve all projects from the database.
    """
    return session.exec(
        sqlmodel.select(models.Project)
    ).all()

# ---------------------------------------------------------------------------- #


def get_filtered_projects(
    session: sqlmodel.Session,
    order_by: schemas.OrderBy = schemas.OrderBy.id,
    order: schemas.Order = schemas.Order.asc,
    limit: int = 100,
    offset: int = 0,
    filter: str | None = None
) -> Sequence[models.Project]:
    """
    Retrieve all projects from the database but apply filters and limits.
    """
    if not filter:
        return session.exec(
            sqlmodel.select(models.Project).order_by(
                sqlmodel.asc(getattr(models.Project, order_by))
                if order == schemas.Order.asc else
                sqlmodel.desc(getattr(models.Project, order_by))
            ).limit(limit).offset(offset)
        ).all()
    else:
        return session.exec(
            sqlmodel.select(models.Project).where(
                models.Project.name.ilike(f"%{filter}%"),  # type: ignore
            ).order_by(
                sqlmodel.asc(getattr(models.Project, order_by))
                if order == schemas.Order.asc else
                sqlmodel.desc(getattr(models.Project, order_by))
            ).limit(limit).offset(offset)
        ).all()

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
