# ---------------------------------------------------------------------------- #

from typing import List, Optional

# ---------------------------------------------------------------------------- #


import mrkr.schemas as schemas

# ---------------------------------------------------------------------------- #


def _get_item_children(
    ocr_result: schemas.OcrResultSchema,
    ocr_item: schemas.OcrItemSchema,
) -> List[schemas.OcrItemSchema]:
    result = []
    for item in ocr_result.items:
        if item.id == ocr_item.id:
            continue

        for relationship in item.relationships:
            if relationship.type == schemas.OcrRelationshipType.child \
                    and relationship.id == item.id:
                result.append(item)

    return result


def _get_item_content(
    ocr_result: schemas.OcrResultSchema,
    ocr_item: schemas.OcrItemSchema,
    content: Optional[str] = None
) -> str:
    if not content:
        content = ""

    if ocr_item.content and len(ocr_item.content) > 0:
        content += (content + " ")

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


def _initialize_label_blocks(
    ocr_result: schemas.OcrResultSchema,
    page: int
) -> List[schemas.BlockLabelSchema]:
    result = []
    for item in ocr_result.items:
        if item.type != schemas.OcrItemType.block:
            continue

        if item.page != page:
            continue

        result.append(
            schemas.BlockLabelSchema(
                ocr_item_id=item.id,
                labels=[],
                text_labels=[],
                content=_get_item_content(
                    ocr_result=ocr_result,
                    ocr_item=item
                )
            )
        )

    return result


def _initialize_label_pages(
    ocr_result: schemas.OcrResultSchema
) -> List[schemas.PageLabelSchema]:
    result = []
    for item in ocr_result.items:
        if item.type != schemas.OcrItemType.page:
            continue

        result.append(
            schemas.PageLabelSchema(
                page=item.page,
                labels=[],
                blocks=_initialize_label_blocks(
                    ocr_result=ocr_result,
                    page=item.page
                )
            )
        )

    return result
