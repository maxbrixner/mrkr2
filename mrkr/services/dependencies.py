# ---------------------------------------------------------------------------- #

import fastapi
from typing import Annotated

# ---------------------------------------------------------------------------- #

import mrkr.services as services

# ---------------------------------------------------------------------------- #


ConfigDependency = Annotated[
    services.ConfigSchema, fastapi.Depends(services.get_configuration)
]

# ---------------------------------------------------------------------------- #
