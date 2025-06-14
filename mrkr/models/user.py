# ---------------------------------------------------------------------------- #

import sqlmodel

# ---------------------------------------------------------------------------- #


class User(sqlmodel.SQLModel, table=True):
    id: int = sqlmodel.Field(primary_key=True)
    username: str = sqlmodel.Field(index=True, unique=True)
    email: str = sqlmodel.Field(index=True, unique=True)
    password: str = sqlmodel.Field()
    disabled: bool = sqlmodel.Field(default=False)

# ---------------------------------------------------------------------------- #
