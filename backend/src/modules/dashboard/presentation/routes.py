from fastapi import APIRouter

from src.core.dependencies import DbSession
from src.modules.auth.presentation.dependencies import CurrentUser
from src.modules.dashboard.application.dtos import DashboardResponse
from src.modules.dashboard.application.service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/overview", response_model=DashboardResponse)
async def get_dashboard(db: DbSession, current_user: CurrentUser) -> DashboardResponse:
    return await DashboardService(db).get_overview()
