# ---------------------------------------------------------------------------- #

import logging
import logging.config
import pathlib
import os
import json

# ---------------------------------------------------------------------------- #

logger = logging.getLogger("app.services")

# ---------------------------------------------------------------------------- #


def setup_logger() -> None:
    """
    Set up logging configuration. The filename is specified in the
    LOGGING environment variable.
    """
    filename = os.getenv("LOGGING", None)

    if not filename:
        raise Exception("LOGGING environment variable not set.")

    logging_file = pathlib.Path(__file__).parent.parent / \
        pathlib.Path("config") / \
        pathlib.Path(filename)

    with logging_file.open("r") as file:
        content = json.load(file)
        logging.config.dictConfig(content)

# ---------------------------------------------------------------------------- #
