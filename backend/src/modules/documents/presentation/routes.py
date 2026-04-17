import uuid

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile

from src.core.dependencies import DbSession, Pagination
from src.core.pagination import PaginatedResponse
from src.modules.auth.presentation.dependencies import CurrentUser, require_role
from src.modules.documents.application.dtos import DocumentListItem, DocumentResponse
from src.modules.documents.application.service import DocumentService
from src.modules.iam.domain.models import User

router = APIRouter(prefix="/documents", tags=["documents"])

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


@router.post("", response_model=DocumentResponse, status_code=201)
async def upload_document(
    db: DbSession,
    current_user: CurrentUser,
    file: UploadFile = File(...),
    category: str = Form(default="other"),
    description: str | None = Form(default=None),
    entity_type: str | None = Form(default=None),
    entity_id: str | None = Form(default=None),
) -> DocumentResponse:
    file_data = await file.read()
    if len(file_data) > MAX_FILE_SIZE:
        from src.core.errors import AppError
        raise AppError(status_code=413, detail="Arquivo excede o limite de 50 MB.")

    return await DocumentService(db).upload(
        file_data=file_data,
        original_name=file.filename or "arquivo",
        content_type=file.content_type or "application/octet-stream",
        category=category,
        description=description,
        entity_type=entity_type,
        entity_id=entity_id,
        uploaded_by=current_user.id,
    )


@router.get("", response_model=PaginatedResponse[DocumentListItem])
async def list_documents(
    db: DbSession, pagination: Pagination, current_user: CurrentUser,
    category: str | None = Query(None),
    entity_type: str | None = Query(None),
    entity_id: str | None = Query(None),
    search: str | None = Query(None, max_length=100),
) -> PaginatedResponse[DocumentListItem]:
    return await DocumentService(db).list(
        params=pagination, category=category,
        entity_type=entity_type, entity_id=entity_id, search=search,
    )


@router.get("/{doc_id}", response_model=DocumentResponse)
async def get_document(
    doc_id: uuid.UUID, db: DbSession, current_user: CurrentUser,
) -> DocumentResponse:
    return await DocumentService(db).get_by_id(doc_id)


@router.delete("/{doc_id}", status_code=204)
async def delete_document(
    doc_id: uuid.UUID, db: DbSession,
    current_user: User = Depends(require_role("superadmin", "admin")),
) -> None:
    await DocumentService(db).remove(doc_id, deleted_by=current_user.id)
