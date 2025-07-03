# ---------------------------------------------------------------------------- #

import sqlmodel

# ---------------------------------------------------------------------------- #

import mrkr.models as models
import mrkr.schemas as schemas

# ---------------------------------------------------------------------------- #


def create_ocr(
    session: sqlmodel.Session,
    document: models.Document,
    ocr: schemas.OcrResultSchema
) -> models.Ocr:
    """
    Write the OCR result to the database.
    """
    database_ocr = models.Ocr(
        document_id=document.id,
        result=ocr.model_dump(),
    )

    session.add(database_ocr)
    session.commit()
    session.refresh(database_ocr)
    return database_ocr

# ---------------------------------------------------------------------------- #


def get_ocr(
    session: sqlmodel.Session,
    id: int
) -> models.Ocr | None:
    """
    Retrieve an OCR result from the database by its ID.
    """
    return session.get(models.Ocr, id)

# ---------------------------------------------------------------------------- #


def get_current_ocr_id(
    session: sqlmodel.Session,
    document: models.Document
) -> int | None:
    """
    Retrieve the current OCR result for a document.
    """
    return session.exec(
        sqlmodel.select(models.Ocr.id)
        .where(models.Ocr.document_id == document.id)
        .order_by(sqlmodel.desc(models.Ocr.timestamp))
    ).first()

# ---------------------------------------------------------------------------- #


def get_current_ocr(
    session: sqlmodel.Session,
    document: models.Document
) -> models.Ocr | None:
    """
    Retrieve the current OCR result for a document.
    """
    return session.exec(
        sqlmodel.select(models.Ocr)
        .where(models.Ocr.document_id == document.id)
        .order_by(sqlmodel.desc(models.Ocr.timestamp))
    ).first()

# ---------------------------------------------------------------------------- #
