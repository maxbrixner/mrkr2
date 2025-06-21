# ---------------------------------------------------------------------------- #

import fastapi

# ---------------------------------------------------------------------------- #

import mrkr.schemas as schemas

# ---------------------------------------------------------------------------- #


router = fastapi.APIRouter(prefix="/utils", tags=[schemas.Tags.utils])

# ---------------------------------------------------------------------------- #


@router.get("/health", summary="Health Check")
async def utils_health() -> schemas.HealthSchema:
    """
    Return the health of the api.
    """
    return schemas.HealthSchema(
        health=schemas.HealthEnum.healthy,
        message="API is healthy",
    )

# ---------------------------------------------------------------------------- #
