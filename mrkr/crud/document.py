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
    document: schemas.DocumentCreateSchema
) -> models.Document:
    """
    Create a new document in the database.
    """
    database_document = models.Document(
        project_id=document.project_id,
        path=document.path,
    )

    session.add(database_document)
    session.commit()
    session.refresh(database_document)
    return database_document

# ---------------------------------------------------------------------------- #
