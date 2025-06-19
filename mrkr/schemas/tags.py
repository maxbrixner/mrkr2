# ---------------------------------------------------------------------------- #

import pydantic
import enum

# ---------------------------------------------------------------------------- #


class Tags(str, enum.Enum):
    """
    Enum for FastAPI router tags.
    """
    v1 = "v1"
    user = "user"
    utils = "utils"
    document = "document"

    gui = "gui"
    labeling = "labeling"

# ---------------------------------------------------------------------------- #
