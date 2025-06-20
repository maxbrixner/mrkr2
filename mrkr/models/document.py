# ---------------------------------------------------------------------------- #

import sqlmodel
import datetime
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy import Column

# ---------------------------------------------------------------------------- #


class Document(sqlmodel.SQLModel, table=True):
    id: int = sqlmodel.Field(primary_key=True)
    path: str = sqlmodel.Field(
        description="The path to the document file."
    )
    timestamp: datetime.datetime = sqlmodel.Field(
        default_factory=datetime.datetime.now,
        description="The timestamp when the document was added to the project."
    )

# ---------------------------------------------------------------------------- #
