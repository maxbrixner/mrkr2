# ---------------------------------------------------------------------------- #

import fastapi

# ---------------------------------------------------------------------------- #

import mrkr.schemas as schemas
from mrkr.gui.endpoints import gui_document_router, gui_project_router

# ---------------------------------------------------------------------------- #


router = fastapi.APIRouter(prefix="/gui", tags=[schemas.Tags.gui])

router.include_router(gui_document_router)
router.include_router(gui_project_router)


# ---------------------------------------------------------------------------- #
