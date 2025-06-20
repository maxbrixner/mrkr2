# ---------------------------------------------------------------------------- #

import fastapi

# ---------------------------------------------------------------------------- #

import mrkr.schemas as schemas
from mrkr.api.v1.endpoints import document_router
from mrkr.api.v1.endpoints import user_router
from mrkr.api.v1.endpoints import utils_router
from mrkr.api.v1.endpoints import project_router
from mrkr.api.v1.endpoints import ocr_router

# ---------------------------------------------------------------------------- #


router = fastapi.APIRouter(prefix="/api/v1", tags=[schemas.Tags.v1])

router.include_router(document_router)
router.include_router(user_router)
router.include_router(utils_router)
router.include_router(project_router)
router.include_router(ocr_router)


# ---------------------------------------------------------------------------- #
