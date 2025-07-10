# ---------------------------------------------------------------------------- #

import sqlmodel
import datetime
from typing import List
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy import Column

# ---------------------------------------------------------------------------- #


class Project(sqlmodel.SQLModel, table=True):
    id: int = sqlmodel.Field(primary_key=True)
    name: str = sqlmodel.Field(
        description="The name of the project.",
        index=True,
        unique=True
    )
    created: datetime.datetime = sqlmodel.Field(
        default_factory=datetime.datetime.now,
        description="The timestamp when the project was created.",
    )
    updated: datetime.datetime = sqlmodel.Field(
        default_factory=datetime.datetime.now,
        description="The timestamp when the project was created.",
        sa_column_kwargs={"onupdate": lambda: datetime.datetime.now}
    )
    config: dict = sqlmodel.Field(
        sa_column=Column(JSON),
        description="The project configuration."
    )

    documents: List["Document"] = sqlmodel.Relationship(  # type:ignore
        back_populates="project")

# ---------------------------------------------------------------------------- #
