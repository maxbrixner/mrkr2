# ---------------------------------------------------------------------------- #

import sqlmodel
import datetime
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy import Column

# ---------------------------------------------------------------------------- #


class Annotation(sqlmodel.SQLModel, table=True):
    id: int = sqlmodel.Field(primary_key=True)
    ocr_id: int = sqlmodel.Field(
        foreign_key="ocr.id",
        description="The ID of the OCR result associated with this annotation."
    )
    timestamp: datetime.datetime = sqlmodel.Field(
        default_factory=datetime.datetime.now,
        description="The timestamp when the OCR result was created."
    )
    result: dict = sqlmodel.Field(
        sa_column=Column(JSON),
        description="The annotation result as a JSON string."
    )

    ocr: "Ocr" = sqlmodel.Relationship()  # type: ignore

# ---------------------------------------------------------------------------- #
