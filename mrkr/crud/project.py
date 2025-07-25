# ---------------------------------------------------------------------------- #

import sqlmodel
from typing import Dict, Sequence

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
                sqlmodel.or_(
                    models.Project.name.ilike(f"%{filter}%"),  # type: ignore
                    sqlmodel.cast(models.Project.id, sqlmodel.String).ilike(
                        f"%{filter}%")  # type: ignore
                )
            ).order_by(
                sqlmodel.asc(getattr(models.Project, order_by))
                if order == schemas.Order.asc else
                sqlmodel.desc(getattr(models.Project, order_by))
            ).limit(limit).offset(offset)
        ).all()

# ---------------------------------------------------------------------------- #


def get_project_status(
    session: sqlmodel.Session,
    id: int
) -> Dict[models.DocumentStatus, int]:
    """
    Get a project's status by counting all document statuses.
    """
    documents = session.exec(
        sqlmodel.select(models.Document).where(
            models.Document.project_id == id,
        )).all()

    result = {}
    for status in models.DocumentStatus:
        count = sum(1 for doc in documents if doc.status == status)
        result[status] = count

    return result

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


def update_project_configuration(
    session: sqlmodel.Session,
    project: models.Project,
    config: schemas.ProjectConfigSchema | Dict,
) -> models.Project:
    """
    Update a documents label data and status in the database.
    """
    if isinstance(config, schemas.ProjectConfigSchema):
        config = config.model_dump()

    project.config = config

    session.add(project)
    session.commit()
    session.refresh(project)
    return project

# ---------------------------------------------------------------------------- #
