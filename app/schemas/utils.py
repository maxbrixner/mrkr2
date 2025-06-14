# ---------------------------------------------------------------------------- #

import pydantic
import enum

# ---------------------------------------------------------------------------- #


class HealthEnum(str, enum.Enum):
    """
    Enum for health check status.
    """
    HEALTHY = "healthy"
    UNHEALTHY = "unhealthy"

# ---------------------------------------------------------------------------- #


class HealthSchema(pydantic.BaseModel):
    """
    Schema for health check.
    """
    health: HealthEnum
    message: str

# ---------------------------------------------------------------------------- #
