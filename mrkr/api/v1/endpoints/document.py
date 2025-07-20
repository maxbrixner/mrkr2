# ---------------------------------------------------------------------------- #

import fastapi
from typing import Dict, List

# ---------------------------------------------------------------------------- #

import mrkr.schemas as schemas
import mrkr.crud as crud
import mrkr.models as models
import mrkr.providers as providers
import mrkr.database as database
import mrkr.services as services
import mrkr.core as core

# ---------------------------------------------------------------------------- #


router = fastapi.APIRouter(prefix="/document", tags=[schemas.Tags.document])

# ---------------------------------------------------------------------------- #


@router.get("/{document_id}",
            summary="Get Document")
async def get_document(
    session: database.DatabaseDependency,
    document_id: int = fastapi.Path(
        ...,
        description="The unique identifier for the document (as an integer).",
        examples=[1]
    )
) -> schemas.DocumentSchema:
    """
    Return the document from the database.
    """
    document = crud.get_document(session=session, id=document_id)

    if not document:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    document_schema = schemas.DocumentSchema(**document.model_dump())

    return document_schema

# ---------------------------------------------------------------------------- #


@router.get("/{document_id}/content",
            summary="Get Page Content")
async def get_document_content(
    session: database.DatabaseDependency,
    document_id: int = fastapi.Path(
        ...,
        description="The unique identifier for the document (as an integer).",
        examples=[1]
    )
) -> List[schemas.PageContentSchema]:
    """
    Return the content of the document as a json containing the images data
    as a base64 encoded byte strings.
    """
    document = crud.get_document(session=session, id=document_id)

    if not document:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    file_provider = providers.get_file_provider(
        project_config=document.project.config)

    async with file_provider(document.path) as provider:
        images = await provider.read_as_base64_images()

    return images

# ---------------------------------------------------------------------------- #


@router.put("{document_id}/data",
            summary="Update Document Label Data")
async def update_label_data(
    session: database.DatabaseDependency,
    data: schemas.UpdateDocumentLabelDataSchema,
    document_id: int = fastapi.Path(
        ...,
        description="The unique identifier for the document (as an integer).",
        examples=[1]
    )
) -> Dict:
    """
    Update the label data for the document.
    """
    document = crud.get_document(session=session, id=document_id)

    if not document:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    crud.update_document_data_and_status(
        session=session,
        document=document,
        status=document.status,
        data=data
    )

    return {
        "message": "Label data updated successfully.",
    }

# ---------------------------------------------------------------------------- #


@router.post("/{document_id}/scan", summary="Scan Document")
async def scan_document(
    session: database.DatabaseDependency,
    worker: services.WorkerPoolDependency,
    document_id: int = fastapi.Path(
        ...,
        description="The unique identifier for the document (as an integer).",
        examples=[1]
    ),
    force: bool = False
) -> Dict:
    """
    Scan a project.
    """
    document = crud.get_document(session=session, id=document_id)

    if not document:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    worker.submit(
        core.scan_document_sync,
        document_id=document.id,
        force=force
    )

    return {
        "message": f"Scan scheduled for document {document_id}."
    }

# ---------------------------------------------------------------------------- #


@router.put("/assignee",
            summary="Update the Assignee for a List of Documents")
async def update_assignee(
    session: database.DatabaseDependency,
    update: schemas.UpdateDocumentAssigneeSchema,
) -> Dict:
    """
    Update the assignee for a list of documents.
    """
    documents = []
    for document_id in update.document_ids:
        document = crud.get_document(session=session, id=document_id)

        if not document:
            raise fastapi.HTTPException(
                status_code=fastapi.status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )

        documents.append(document)

    assignee = crud.get_user(session=session, id=update.assignee_id)

    if not assignee:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail="Assignee not found"
        )

    crud.batch_update_document_assignee(
        session=session,
        documents=documents,
        assignee_id=assignee.id
    )

    return {
        "message": f"Assignee of {len(documents)} documents updated "
        f"successfully to {assignee.username}.",
    }

# ---------------------------------------------------------------------------- #


@router.put("/reviewer",
            summary="Update the Reviewer for a List of Documents")
async def update_reviewer(
    session: database.DatabaseDependency,
    update: schemas.UpdateDocumentReviewerSchema,
) -> Dict:
    """
    Update the reviewer for a list of document.
    """
    documents = []
    for document_id in update.document_ids:
        document = crud.get_document(session=session, id=document_id)

        if not document:
            raise fastapi.HTTPException(
                status_code=fastapi.status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )

        documents.append(document)

    reviewer = crud.get_user(session=session, id=update.reviewer_id)

    if not reviewer:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail="Reviewer not found"
        )

    crud.batch_update_document_reviewer(
        session=session,
        documents=documents,
        reviewer_id=reviewer.id
    )

    return {
        "message": f"Reviewer of {len(documents)} documents updated "
        f"successfully to {reviewer.username}.",
    }

# ---------------------------------------------------------------------------- #


@router.put("/status",
            summary="Update the Status for a List of Documents")
async def update_status(
    session: database.DatabaseDependency,
    update: schemas.UpdateDocumentStatusSchema,
) -> Dict:
    """
    Update the status for a list of document.
    """
    documents = []
    for document_id in update.document_ids:
        document = crud.get_document(session=session, id=document_id)

        if not document:
            raise fastapi.HTTPException(
                status_code=fastapi.status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )

        documents.append(document)

    if update.status == models.DocumentStatus.processing:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail="Cannot set status to 'processing' manually."
        )

    crud.batch_update_document_status(
        session=session,
        documents=documents,
        status=update.status
    )

    return {
        "message": f"Status of {len(documents)} documents updated "
        f"successfully to '{update.status.value}'.",
    }

# ---------------------------------------------------------------------------- #
