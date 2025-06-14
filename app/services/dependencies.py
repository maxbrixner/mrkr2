# ---------------------------------------------------------------------------- #

import fastapi
from typing import Annotated

# ---------------------------------------------------------------------------- #

import app.services as services

# ---------------------------------------------------------------------------- #


ConfigDependency = Annotated[
    services.ConfigSchema, fastapi.Depends(services.get_configuration)
]

# ---------------------------------------------------------------------------- #
