import uuid

from sqlalchemy import delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.errors import NotFoundError
from src.core.pagination import PaginatedResponse, PaginationParams
from src.modules.documents.application.dtos import DocumentListItem, DocumentResponse
from src.modules.documents.domain.models import Document
from src.modules.iam.domain.models import AuditLog
from src.shared.services import storage


class DocumentService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def upload(
        self, file_data: bytes, original_name: str, content_type: str,
        category: str = "other", description: str | None = None,
        entity_type: str | None = None, entity_id: str | None = None,
        uploaded_by: uuid.UUID | None = None,
    ) -> DocumentResponse:
        storage_key = storage.upload_file(
            file_data=file_data,
            content_type=content_type,
            original_name=original_name,
            category=category,
        )

        doc = Document(
            file_name=storage_key.rsplit("/", 1)[-1],
            original_name=original_name,
            content_type=content_type,
            file_size=len(file_data),
            storage_key=storage_key,
            category=category,
            description=description,
            entity_type=entity_type,
            entity_id=entity_id,
            uploaded_by=uploaded_by,
        )
        self._db.add(doc)
        await self._db.flush()
        await self._db.refresh(doc)

        self._db.add(AuditLog(
            user_id=uploaded_by, action="document.uploaded",
            entity_type="document", entity_id=str(doc.id),
            detail=f"File {original_name} uploaded ({category})",
        ))

        return self._to_response(doc, include_url=True)

    async def get_by_id(self, doc_id: uuid.UUID) -> DocumentResponse:
        doc = await self._find_or_404(doc_id)
        return self._to_response(doc, include_url=True)

    async def list(
        self, params: PaginationParams, category: str | None = None,
        entity_type: str | None = None, entity_id: str | None = None,
        search: str | None = None,
    ) -> PaginatedResponse[DocumentListItem]:
        query = select(Document)
        count_query = select(func.count()).select_from(Document)
        filters = []

        if category:
            filters.append(Document.category == category)
        if entity_type:
            filters.append(Document.entity_type == entity_type)
        if entity_id:
            filters.append(Document.entity_id == entity_id)
        if search:
            p = f"%{search}%"
            filters.append(or_(
                Document.original_name.ilike(p),
                Document.description.ilike(p),
            ))

        if filters:
            query = query.where(*filters)
            count_query = count_query.where(*filters)

        total = (await self._db.execute(count_query)).scalar_one()
        query = query.order_by(Document.created_at.desc()).offset(params.offset).limit(params.page_size)
        docs = (await self._db.execute(query)).scalars().all()
        items = [DocumentListItem.model_validate(d) for d in docs]
        return PaginatedResponse.create(items=items, total=total, params=params)

    async def remove(
        self, doc_id: uuid.UUID, deleted_by: uuid.UUID | None = None,
    ) -> None:
        doc = await self._find_or_404(doc_id)
        storage.delete_file(doc.storage_key)
        self._db.add(AuditLog(
            user_id=deleted_by, action="document.deleted",
            entity_type="document", entity_id=str(doc_id),
            detail=f"File {doc.original_name} deleted",
        ))
        await self._db.execute(delete(Document).where(Document.id == doc_id))

    async def _find_or_404(self, doc_id: uuid.UUID) -> Document:
        result = await self._db.execute(select(Document).where(Document.id == doc_id))
        doc = result.scalar_one_or_none()
        if not doc:
            raise NotFoundError("Documento", str(doc_id))
        return doc

    def _to_response(self, doc: Document, include_url: bool = False) -> DocumentResponse:
        url = None
        if include_url:
            try:
                url = storage.get_download_url(doc.storage_key)
            except Exception:
                url = None
        return DocumentResponse(
            id=doc.id, file_name=doc.file_name, original_name=doc.original_name,
            content_type=doc.content_type, file_size=doc.file_size,
            category=doc.category, description=doc.description,
            entity_type=doc.entity_type, entity_id=doc.entity_id,
            download_url=url, created_at=doc.created_at,
        )
