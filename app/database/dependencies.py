# ---------------------------------------------------------------------------- #

import fastapi
import sqlmodel
from typing import Annotated

# ---------------------------------------------------------------------------- #

from app.database import get_database_session

# ---------------------------------------------------------------------------- #


DatabaseDependency = Annotated[
    sqlmodel.Session, fastapi.Depends(get_database_session)
]

# ---------------------------------------------------------------------------- #
