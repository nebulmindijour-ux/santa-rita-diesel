from datetime import date
from typing import Literal

from pydantic import BaseModel

NotificationSeverity = Literal["critical", "warning", "info"]
NotificationCategory = Literal["document", "maintenance", "operation"]


class NotificationItem(BaseModel):
    id: str
    category: NotificationCategory
    severity: NotificationSeverity
    title: str
    message: str
    link: str
    date_reference: date | None = None


class NotificationsSummary(BaseModel):
    total: int
    critical_count: int
    warning_count: int
    items: list[NotificationItem]
