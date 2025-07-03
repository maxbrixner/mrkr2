# ---------------------------------------------------------------------------- #

import logging
import functools
import asyncio
import sqlmodel
from typing import Any, Callable

# ---------------------------------------------------------------------------- #

import mrkr.providers as providers
import mrkr.schemas as schemas
import mrkr.models as models
import mrkr.crud as crud
import mrkr.database as database

# ---------------------------------------------------------------------------- #

logger = logging.getLogger("mrkr.core")

# ---------------------------------------------------------------------------- #


def run_as_sync(func: Callable) -> Callable:
    """
    Decorator to make an async function runnable in a thread pool.
    """
    @functools.wraps(func)
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        return asyncio.run(func(*args, **kwargs))
    return wrapper

# ---------------------------------------------------------------------------- #


@run_as_sync
async def scan_project(project: models.Project) -> None:
    """
    Scan the project.
    """
    logger.debug("Scanning project...")

    session = next(database.get_database_session())

    try:
        await _scan_project_documents(session=session, project=project)
    except Exception as exception:
        logger.error(f"Error scanning project documents: {exception}")

    try:
        await _run_project_ocr(session=session, project=project)
    except Exception as exception:
        logger.error(f"Error scanning project documents: {exception}")

    try:
        await _create_label_setup(session=session, project=project)
    except Exception as exception:
        logger.error(f"Error creating label setup: {exception}")

# ---------------------------------------------------------------------------- #


async def _scan_project_documents(
    session: sqlmodel.Session,
    project: models.Project
) -> None:
    """
    List the files in a project, compare them with the database,
    and create new documents if they do not exist.
    """
    logger.debug("Scanning project documents...")

    db_documents = crud.get_project_documents(
        session=session,
        project_id=project.id
    )

    db_paths = [document.path for document in db_documents]

    file_provider = providers.get_file_provider(
        project_config=project.config)

    async with file_provider("/") as provider:
        async for file in provider.list():

            if file in db_paths:
                logger.debug(f"Document already exists: {file}")
                continue

            logger.debug(f"Creating document: {file}")

            crud.create_document(
                session=session,
                document=schemas.DocumentCreateSchema(
                    project_id=project.id,
                    path=file
                )
            )

    logger.debug("Project document scan successful.")

# ---------------------------------------------------------------------------- #


async def _run_project_ocr(
    session: sqlmodel.Session,
    project: models.Project
) -> None:
    """
    Run OCR on the project documents using the configured OCR provider.
    """
    logger.debug("Running project OCR...")

    db_documents = crud.get_project_documents(
        session=session,
        project_id=project.id
    )

    file_provider = providers.get_file_provider(
        project_config=project.config)

    ocr_provider = providers.get_ocr_provider(
        project_config=project.config)

    for document in db_documents:

        if document.ocr:
            logger.debug(f"Document already has OCR: {document.path}")
            continue

        logger.debug(f"Running OCR on document: {document.path}")

        async with file_provider(document.path) as provider:
            images = await provider.read_as_images()

            async with ocr_provider(images=images) as ocr_provider:
                ocr = await ocr_provider.ocr()

                crud.create_ocr(
                    session=session,
                    document=document,
                    ocr=ocr
                )

    logger.debug("Project OCR successful.")


# ---------------------------------------------------------------------------- #


async def _create_label_setup(
    session: sqlmodel.Session,
    project: models.Project
) -> None:
    """
    Create the label setup for the project.
    """
    logger.debug("Creating label setup...")

    logger.debug("Label setup created successfully.")

# ---------------------------------------------------------------------------- #
