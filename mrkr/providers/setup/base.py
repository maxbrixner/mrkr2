# ---------------------------------------------------------------------------- #

from typing import Self

# ---------------------------------------------------------------------------- #

import mrkr.schemas as schemas

# ---------------------------------------------------------------------------- #


class BaseLabelSetupProvider:
    """
    Base class for label setups.
    """

    def __init__(self, config: schemas.BlockwiseLabelSetupConfig):
        self.config = config

    def __call__(self) -> Self:
        return self


# ---------------------------------------------------------------------------- #
