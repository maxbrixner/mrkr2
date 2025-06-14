# ---------------------------------------------------------------------------- #

import fastapi

# ---------------------------------------------------------------------------- #

import mrkr.schemas as schemas
from mrkr.api.v1.endpoints import user_router
from mrkr.api.v1.endpoints import utils_router

# ---------------------------------------------------------------------------- #


router = fastapi.APIRouter(prefix="/api/v1", tags=[schemas.Tags.v1])

router.include_router(user_router)
router.include_router(utils_router)


# ---------------------------------------------------------------------------- #
