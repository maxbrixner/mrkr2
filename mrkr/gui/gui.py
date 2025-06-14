# ---------------------------------------------------------------------------- #

import fastapi

# ---------------------------------------------------------------------------- #

import mrkr.schemas as schemas
from mrkr.gui.endpoints import labeling_router

# ---------------------------------------------------------------------------- #


router = fastapi.APIRouter(prefix="/gui", tags=[schemas.Tags.gui])

router.include_router(labeling_router)


# ---------------------------------------------------------------------------- #
