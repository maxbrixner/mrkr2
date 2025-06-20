# ---------------------------------------------------------------------------- #

import fastapi
from fastapi.templating import Jinja2Templates
from typing import Annotated

# ---------------------------------------------------------------------------- #

import mrkr.services as services

# ---------------------------------------------------------------------------- #


ConfigDependency = Annotated[
    services.ConfigSchema, fastapi.Depends(services.get_configuration)
]

TemplatesDependency = Annotated[
    Jinja2Templates, fastapi.Depends(services.get_templates)
]

# ---------------------------------------------------------------------------- #
