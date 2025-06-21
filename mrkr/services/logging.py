# ---------------------------------------------------------------------------- #

import logging
import logging.config
import pathlib
import os
import json

# ---------------------------------------------------------------------------- #

logger = logging.getLogger("mrkr.services")

# ---------------------------------------------------------------------------- #


class ColonLevelFormatter(logging.Formatter):
    """
    Custom logging formatter that appends a colon to the level name
    and pads it to a fixed width. This is used to ensure consistent
    formatting to uvicorn log messages.
    """

    def format(self, record: logging.LogRecord) -> str:
        record.levelname = f"{record.levelname}:"
        return super().format(record)

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
