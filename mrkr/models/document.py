# ---------------------------------------------------------------------------- #

import sqlmodel
import datetime
import enum
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSON
from typing import Optional

# ---------------------------------------------------------------------------- #

from .project import Project

# ---------------------------------------------------------------------------- #


class DocumentStatus(str, enum.Enum):
    processing = "processing"
    open = "open"
    in_review = "in review"
    done = "done"

# ---------------------------------------------------------------------------- #


class Document(sqlmodel.SQLModel, table=True):
    id: int = sqlmodel.Field(primary_key=True)
    project_id: int = sqlmodel.Field(
        foreign_key="project.id",
        description="The ID of the project this document belongs to."
    )
    created: datetime.datetime = sqlmodel.Field(
        default_factory=datetime.datetime.now,
        description="The timestamp when the document was created.",
    )
    updated: datetime.datetime = sqlmodel.Field(
        default_factory=datetime.datetime.now,
        description="The timestamp when the document was last updated.",
        sa_column_kwargs={"onupdate": lambda: datetime.datetime.now()}
    )
    path: str = sqlmodel.Field(
        description="The path to the document file within its source."
    )
    status: DocumentStatus = sqlmodel.Field(
        ...,
        description="The status of the document."
    )
    data: Optional[dict] = sqlmodel.Field(
        default=None,
        sa_column=Column(JSON),
        description="The label data for the document"
    )

    project: Project = sqlmodel.Relationship()

# ---------------------------------------------------------------------------- #
