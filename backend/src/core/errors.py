from dataclasses import dataclass, field
from typing import Any

from fastapi import Request
from fastapi.responses import JSONResponse


@dataclass(frozen=True, slots=True)
class FieldError:
    field: str
    message: str
    code: str


@dataclass(frozen=True, slots=True)
class ProblemDetail:
    type: str
    title: str
    status: int
    detail: str
    error_code: str
    errors: list[FieldError] = field(default_factory=list)
    extra: dict[str, Any] = field(default_factory=dict)


class AppError(Exception):
    def __init__(self, problem: ProblemDetail) -> None:
        self.problem = problem
        super().__init__(problem.detail)


class ValidationError(AppError):
    def __init__(self, errors: list[FieldError]) -> None:
        super().__init__(
            ProblemDetail(
                type="https://santaritadiesel.com/errors/validation-error",
                title="Erro de validação",
                status=422,
                detail="Um ou mais campos contêm valores inválidos.",
                error_code="VALIDATION_ERROR",
                errors=errors,
            )
        )


class NotFoundError(AppError):
    def __init__(self, resource: str, identifier: str | None = None) -> None:
        detail = f"{resource} não encontrado."
        if identifier:
            detail = f"{resource} com identificador '{identifier}' não encontrado."
        super().__init__(
            ProblemDetail(
                type="https://santaritadiesel.com/errors/not-found",
                title="Recurso não encontrado",
                status=404,
                detail=detail,
                error_code="RESOURCE_NOT_FOUND",
            )
        )


class ConflictError(AppError):
    def __init__(self, detail: str) -> None:
        super().__init__(
            ProblemDetail(
                type="https://santaritadiesel.com/errors/conflict",
                title="Conflito de recurso",
                status=409,
                detail=detail,
                error_code="RESOURCE_CONFLICT",
            )
        )


class ForbiddenError(AppError):
    def __init__(self, detail: str = "Você não tem permissão para realizar esta ação.") -> None:
        super().__init__(
            ProblemDetail(
                type="https://santaritadiesel.com/errors/forbidden",
                title="Acesso negado",
                status=403,
                detail=detail,
                error_code="IAM_FORBIDDEN",
            )
        )


class UnauthorizedError(AppError):
    def __init__(self, detail: str = "Autenticação necessária.", error_code: str = "AUTH_REQUIRED") -> None:
        super().__init__(
            ProblemDetail(
                type="https://santaritadiesel.com/errors/unauthorized",
                title="Não autenticado",
                status=401,
                detail=detail,
                error_code=error_code,
            )
        )


def _problem_to_dict(problem: ProblemDetail, instance: str) -> dict[str, Any]:
    body: dict[str, Any] = {
        "type": problem.type,
        "title": problem.title,
        "status": problem.status,
        "detail": problem.detail,
        "error_code": problem.error_code,
        "instance": instance,
    }
    if problem.errors:
        body["errors"] = [
            {"field": e.field, "message": e.message, "code": e.code}
            for e in problem.errors
        ]
    if problem.extra:
        body.update(problem.extra)
    return body


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.problem.status,
        content=_problem_to_dict(exc.problem, str(request.url.path)),
    )


async def generic_error_handler(request: Request, exc: Exception) -> JSONResponse:
    from src.core.config import get_settings

    settings = get_settings()
    detail = "Ocorreu um erro interno. Tente novamente mais tarde."
    if settings.is_development:
        detail = f"{type(exc).__name__}: {exc}"

    return JSONResponse(
        status_code=500,
        content={
            "type": "https://santaritadiesel.com/errors/internal",
            "title": "Erro interno",
            "status": 500,
            "detail": detail,
            "error_code": "INTERNAL_ERROR",
            "instance": str(request.url.path),
        },
    )
