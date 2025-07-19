# ---------------------------------------------------------------------------- #

import sqlmodel
import datetime
from typing import List, Sequence

# ---------------------------------------------------------------------------- #

import mrkr.models as models
import mrkr.schemas as schemas

# ---------------------------------------------------------------------------- #


def get_document(
    session: sqlmodel.Session,
    id: int
) -> models.Document | None:
    """
    Retrieve a document from the database by its ID.
    """
    return session.get(models.Document, id)

# ---------------------------------------------------------------------------- #


def get_project_documents(
    session: sqlmodel.Session,
    project_id: int
) -> Sequence[models.Document]:
    """
    Retrieve all documents for a specific project from the database.
    """
    return session.exec(
        sqlmodel.select(models.Document).where(
            models.Document.project_id == project_id
        )
    ).all()

# ---------------------------------------------------------------------------- #


def get_project_filtered_documents(
    session: sqlmodel.Session,
    project_id: int,
    order_by: schemas.OrderBy = schemas.OrderBy.id,
    order: schemas.Order = schemas.Order.asc,
    limit: int = 100,
    offset: int = 0,
    filter: str | None = None
) -> Sequence[models.Document]:
    """
    Retrieve all documents for a specific project from the database.
    """
    if not filter:
        return session.exec(
            sqlmodel.select(models.Document).where(
                models.Document.project_id == project_id
            ).order_by(
                sqlmodel.asc(getattr(models.Document, order_by))
                if order == schemas.Order.asc else
                sqlmodel.desc(getattr(models.Document, order_by))
            ).limit(limit).offset(offset)
        ).all()
    else:
        return session.exec(
            sqlmodel.select(models.Document).where(
                models.Document.project_id == project_id,
                models.Document.path.contains(filter)  # type: ignore
            ).order_by(
                sqlmodel.asc(getattr(models.Document, order_by))
                if order == schemas.Order.asc else
                sqlmodel.desc(getattr(models.Document, order_by))
            ).limit(limit).offset(offset)
        ).all()

# ---------------------------------------------------------------------------- #


def create_document(
    session: sqlmodel.Session,
    project_id: int,
    path: str
) -> models.Document:
    """
    Create a new document in the database.
    """
    database_document = models.Document(
        project_id=project_id,
        path=path,
    )

    session.add(database_document)
    session.commit()
    session.refresh(database_document)
    return database_document

# ---------------------------------------------------------------------------- #


def update_document(
    session: sqlmodel.Session,
    document: models.Document,
    path: str,
    data: schemas.DocumentLabelDataSchema
) -> models.Document:
    """
    Update a documents metacontent in the database.
    """
    document.path = path
    document.data = data.model_dump()

    session.add(document)
    session.commit()
    session.refresh(document)
    return document

# ---------------------------------------------------------------------------- #
