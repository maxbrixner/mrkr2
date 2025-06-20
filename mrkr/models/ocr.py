# ---------------------------------------------------------------------------- #

import sqlmodel
import datetime
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy import Column

# ---------------------------------------------------------------------------- #


class Ocr(sqlmodel.SQLModel, table=True):
    id: int = sqlmodel.Field(primary_key=True)
    document_id: int = sqlmodel.Field(
        foreign_key="document.id",
        description="The ID of the document associated with this OCR result."
    )
    timestamp: datetime.datetime = sqlmodel.Field(
        default_factory=datetime.datetime.now,
        description="The timestamp when the OCR result was created."
    )
    result: dict = sqlmodel.Field(
        sa_column=Column(JSON),
        description="The OCR result as a JSON string."
    )

# ---------------------------------------------------------------------------- #
