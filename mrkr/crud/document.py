# ---------------------------------------------------------------------------- #

import sqlmodel
from typing import List, Dict, Sequence, Optional

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
    Retrieve all documents for a specific project from the database but
    apply filters and limits.
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
                sqlmodel.or_(
                    models.Document.path.ilike(f"%{filter}%"),  # type: ignore
                    sqlmodel.cast(
                        models.Document.status, sqlmodel.String).ilike(
                        f"%{filter}%"),  # type: ignore
                    sqlmodel.cast(
                        models.Document.id, sqlmodel.String).ilike(
                        f"%{filter}%")  # type: ignore
                )
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
        status=models.DocumentStatus.processing
    )

    session.add(database_document)
    session.commit()
    session.refresh(database_document)
    return database_document

# ---------------------------------------------------------------------------- #


def update_document_data_and_status(
    session: sqlmodel.Session,
    document: models.Document,
    status: models.DocumentStatus,
    data: schemas.DocumentLabelDataSchema | Dict,
) -> models.Document:
    """
    Update a documents label data and status in the database.
    """
    if isinstance(data, schemas.DocumentLabelDataSchema):
        data = data.model_dump()

    document.status = status
    document.data = data

    session.add(document)
    session.commit()
    session.refresh(document)
    return document

# ---------------------------------------------------------------------------- #


def update_document_assignee(
    session: sqlmodel.Session,
    document: models.Document,
    assignee_id: Optional[int] = None
) -> models.Document:
    """
    Update a documents assignee.
    """
    document.assignee_id = assignee_id

    session.add(document)
    session.commit()
    session.refresh(document)
    return document

# ---------------------------------------------------------------------------- #


def update_document_reviewer(
    session: sqlmodel.Session,
    document: models.Document,
    reviewer_id: Optional[int] = None
) -> models.Document:
    """
    Update a documents reviewer.
    """
    document.reviewer_id = reviewer_id

    session.add(document)
    session.commit()
    session.refresh(document)
    return document

# ---------------------------------------------------------------------------- #


def batch_update_document_assignee(
    session: sqlmodel.Session,
    documents: List[models.Document],
    assignee_id: Optional[int] = None
) -> None:
    """
    Update the assignee for a list of documents.
    """
    for document in documents:
        document.assignee_id = assignee_id
        session.add(document)

    session.commit()

# ---------------------------------------------------------------------------- #


def batch_update_document_reviewer(
    session: sqlmodel.Session,
    documents: List[models.Document],
    reviewer_id: Optional[int] = None
) -> None:
    """
    Update the reviewer for a list of documents.
    """
    for document in documents:
        document.reviewer_id = reviewer_id
        session.add(document)

    session.commit()

# ---------------------------------------------------------------------------- #


def batch_update_document_status(
    session: sqlmodel.Session,
    documents: List[models.Document],
    status: models.DocumentStatus
) -> None:
    """
    Update the status for a list of documents.
    """
    for document in documents:
        document.status = status
        session.add(document)

    session.commit()

# ---------------------------------------------------------------------------- #
