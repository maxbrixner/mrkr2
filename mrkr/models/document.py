# ---------------------------------------------------------------------------- #

import sqlmodel
import datetime

# ---------------------------------------------------------------------------- #


class Document(sqlmodel.SQLModel, table=True):
    id: int = sqlmodel.Field(primary_key=True)
    project_id: int = sqlmodel.Field(
        foreign_key="project.id",
        description="The ID of the project this document belongs to."
    )
    path: str = sqlmodel.Field(
        description="The path to the document file."
    )
    timestamp: datetime.datetime = sqlmodel.Field(
        default_factory=datetime.datetime.now,
        description="The timestamp when the document was added to the project."
    )

# ---------------------------------------------------------------------------- #
