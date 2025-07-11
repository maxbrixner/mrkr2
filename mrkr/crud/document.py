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
