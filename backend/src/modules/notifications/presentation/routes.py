from fastapi import APIRouter

from src.core.dependencies import DbSession
from src.modules.auth.presentation.dependencies import CurrentUser
from src.modules.notifications.application.dtos import NotificationsSummary
from src.modules.notifications.application.service import NotificationsService

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/summary", response_model=NotificationsSummary)
async def get_notifications(db: DbSession, current_user: CurrentUser) -> NotificationsSummary:
    return await NotificationsService(db).get_summary()
