# ---------------------------------------------------------------------------- #

import logging
import functools
import asyncio
import sqlmodel
from typing import Any, Callable, List, Optional

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
async def scan_project(
    project: models.Project,
    force: bool = False,
    session: sqlmodel.Session | None = None
) -> None:
    """
    Scan the project.
    """
    logger.debug(f"Scanning project {project.id}...")

    try:
        if not session:
            session = next(database.get_database_session())

        await _scan_project_file_system(session=session, project=project)

        documents = crud.get_project_documents(
            session=session,
            project_id=project.id
        )

        for document in documents:
            await scan_document(
                document=document,
                force=force,
                session=session
            )

    except Exception as exception:
        logger.error(f"Error scanning project {project.id}: {exception}")

    logger.debug(f"Scan of project {project.id} successful.")

# ---------------------------------------------------------------------------- #


async def scan_document(
    document: models.Document,
    force: bool = False,
    session: sqlmodel.Session | None = None
) -> None:
    """
    Scan a single document.
    """
    logger.debug(f"Scanning document {document.id}...")

    if not session:
        session = next(database.get_database_session())

    try:

        if document.metacontent is None or force:
            await _update_document_metadata(
                session=session,
                document=document
            )

        if document.labelcontent is None or force:
            ocr_result = await _run_document_ocr(
                document=document
            )

            await _create_label_content(
                session=session,
                document=document,
                ocr_result=ocr_result
            )

    except Exception as exception:
        logger.error(f"Error scanning document {document.id}: {exception}")

    logger.debug(f"Scan of document {document.id} successful.")

# ---------------------------------------------------------------------------- #


async def _scan_project_file_system(
    session: sqlmodel.Session,
    project: models.Project
) -> None:
    """
    List the files in a project, compare them with the database,
    and create new documents if they do not exist.
    """
    logger.debug("Scanning project file system...")

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

    logger.debug("Project file system scan successful.")

# ---------------------------------------------------------------------------- #


async def _update_document_metadata(
    session: sqlmodel.Session,
    document: models.Document
) -> None:
    """
    Uses the file provider to get image metadata for a document and update
    it in the database.
    """
    logger.debug(f"Updating metadata for document {document.id}...")

    file_provider = providers.get_file_provider(
        project_config=document.project.config)

    async with file_provider(document.path) as provider:
        metadata = await provider.image_metadata

        crud.update_document_meta_content(
            session=session,
            document=document,
            meta_content=metadata
        )

    logger.debug(f"Update of metadata for document {document.id} successful.")

# ---------------------------------------------------------------------------- #


async def _run_document_ocr(
    document: models.Document
) -> schemas.OcrResultSchema:
    """
    Run OCR on a document using the configured OCR provider.
    """
    logger.debug(f"Running OCR for document {document.id}...")

    file_provider = providers.get_file_provider(
        project_config=document.project.config)

    ocr_provider = providers.get_ocr_provider(
        project_config=document.project.config)

    async with file_provider(document.path) as provider:
        images = await provider.read_as_images()

        async with ocr_provider(images=images) as ocr_provider:
            ocr = await ocr_provider.ocr()

    logger.debug(f"OCR for document {document.id} successful.")

    return ocr


# ---------------------------------------------------------------------------- #


async def _create_label_content(
    session: sqlmodel.Session,
    document: models.Document,
    ocr_result: schemas.OcrResultSchema
) -> None:
    """
    Create the label setup for a document and update it in the database.
    """
    logger.debug(f"Creating label content for document {document.id}...")

    label_content = schemas.DocumentLabelDataSchema(
        pages=_initialize_label_pages(ocr_result=ocr_result),
        labels=[]
    )

    crud.update_document_label_content(
        session=session,
        document=document,
        label_content=label_content
    )

    logger.debug(
        f"Label content for document {document.id} created successfully.")

# ---------------------------------------------------------------------------- #


def _get_item_children(
    ocr_result: schemas.OcrResultSchema,
    ocr_item: schemas.OcrItemSchema,
) -> List[schemas.OcrItemSchema]:
    """
    Return a list of children for an OCR item.
    """
    result = []
    for item in ocr_result.items:
        if item.id == ocr_item.id:
            continue

        for relationship in item.relationships:
            if relationship.type == schemas.OcrRelationshipType.child \
                    and relationship.id == ocr_item.id:
                result.append(item)

    return result

# ---------------------------------------------------------------------------- #


def _get_item_content(
    ocr_result: schemas.OcrResultSchema,
    ocr_item: schemas.OcrItemSchema,
    content: Optional[str] = None
) -> str:
    """
    Recursively traverse the ocr result to get the content of a certain item
    (including its children).
    """
    if not content:
        content = ""

    if ocr_item.content and len(ocr_item.content) > 0:
        content += (ocr_item.content + " ")

    children = _get_item_children(
        ocr_result=ocr_result,
        ocr_item=ocr_item
    )

    for child in children:
        match child.type:
            case schemas.OcrItemType.paragraph:
                if len(content) > 0 and not content.endswith('\n'):
                    content = content.strip() + '\n\n'
            case schemas.OcrItemType.line:
                if len(content) > 0 and not content.endswith('\n'):
                    content = content.strip() + '\n'
            case _:
                pass
        content = _get_item_content(
            ocr_result=ocr_result,
            ocr_item=child,
            content=content
        )

    return content

# ---------------------------------------------------------------------------- #


def _initialize_label_blocks(
    ocr_result: schemas.OcrResultSchema,
    page: int
) -> List[schemas.BlockLabelDataSchema]:
    """
    Initialize all blocks in a page.
    """
    result = []
    for item in ocr_result.items:
        if item.type != schemas.OcrItemType.block:
            continue

        if item.page != page:
            continue

        result.append(
            schemas.BlockLabelDataSchema(
                id=item.id,
                labels=[],
                text_labels=[],
                position=schemas.PositionSchema(
                    left=item.left,
                    top=item.top,
                    width=item.width,
                    height=item.height
                ),
                content=_get_item_content(
                    ocr_result=ocr_result,
                    ocr_item=item
                ).strip()
            )
        )

    return result

# ---------------------------------------------------------------------------- #


def _initialize_label_pages(
    ocr_result: schemas.OcrResultSchema
) -> List[schemas.PageLabelDataSchema]:
    """
    Initialize a page.
    """
    result = []
    for item in ocr_result.items:
        if item.type != schemas.OcrItemType.page:
            continue

        result.append(
            schemas.PageLabelDataSchema(
                id=item.id,
                page=item.page,
                labels=[],
                blocks=_initialize_label_blocks(
                    ocr_result=ocr_result,
                    page=item.page
                )
            )
        )

    return result

# ---------------------------------------------------------------------------- #
