import uuid
from datetime import datetime

from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: uuid.UUID
    file_name: str
    original_name: str
    content_type: str
    file_size: int
    category: str
    description: str | None
    entity_type: str | None
    entity_id: str | None
    download_url: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentListItem(BaseModel):
    id: uuid.UUID
    original_name: str
    content_type: str
    file_size: int
    category: str
    description: str | None
    entity_type: str | None
    entity_id: str | None
    created_at: datetime

    class Config:
        from_attributes = True
