import asyncio
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.core.config import get_settings
from src.core.security import hash_password
from src.modules.iam.domain.models import Permission, Role, RolePermission, User

settings = get_settings()

ROLES = [
    {"name": "superadmin", "display_name": "Super Administrador", "description": "Acesso total ao sistema", "is_system": True},
    {"name": "admin", "display_name": "Administrador", "description": "Gestão administrativa completa", "is_system": True},
    {"name": "gestor", "display_name": "Gestor", "description": "Gestão operacional", "is_system": False},
    {"name": "operador", "display_name": "Operador", "description": "Operações e entregas", "is_system": False},
    {"name": "financeiro", "display_name": "Financeiro", "description": "Módulo financeiro e fiscal", "is_system": False},
    {"name": "motorista", "display_name": "Motorista", "description": "Acesso restrito de motorista", "is_system": False},
    {"name": "cliente", "display_name": "Cliente", "description": "Portal de acompanhamento", "is_system": False},
]

PERMISSIONS = [
    {"code": "users:read", "display_name": "Visualizar usuários", "module": "users"},
    {"code": "users:write", "display_name": "Criar/editar usuários", "module": "users"},
    {"code": "users:delete", "display_name": "Excluir usuários", "module": "users"},
    {"code": "roles:read", "display_name": "Visualizar papéis", "module": "iam"},
    {"code": "roles:write", "display_name": "Gerenciar papéis", "module": "iam"},
    {"code": "audit:read", "display_name": "Visualizar auditoria", "module": "audit"},
    {"code": "dashboard:read", "display_name": "Visualizar dashboard", "module": "dashboard"},
    {"code": "customers:read", "display_name": "Visualizar clientes", "module": "customers"},
    {"code": "customers:write", "display_name": "Criar/editar clientes", "module": "customers"},
    {"code": "suppliers:read", "display_name": "Visualizar fornecedores", "module": "suppliers"},
    {"code": "suppliers:write", "display_name": "Criar/editar fornecedores", "module": "suppliers"},
    {"code": "fleet:read", "display_name": "Visualizar frota", "module": "fleet"},
    {"code": "fleet:write", "display_name": "Criar/editar frota", "module": "fleet"},
    {"code": "drivers:read", "display_name": "Visualizar motoristas", "module": "drivers"},
    {"code": "drivers:write", "display_name": "Criar/editar motoristas", "module": "drivers"},
    {"code": "operations:read", "display_name": "Visualizar operações", "module": "operations"},
    {"code": "operations:write", "display_name": "Criar/editar operações", "module": "operations"},
    {"code": "maintenance:read", "display_name": "Visualizar manutenção", "module": "maintenance"},
    {"code": "maintenance:write", "display_name": "Criar/editar manutenção", "module": "maintenance"},
    {"code": "inventory:read", "display_name": "Visualizar estoque", "module": "inventory"},
    {"code": "inventory:write", "display_name": "Criar/editar estoque", "module": "inventory"},
    {"code": "finance:read", "display_name": "Visualizar financeiro", "module": "finance"},
    {"code": "finance:write", "display_name": "Criar/editar financeiro", "module": "finance"},
    {"code": "fiscal:read", "display_name": "Visualizar fiscal", "module": "fiscal"},
    {"code": "fiscal:write", "display_name": "Criar/editar fiscal", "module": "fiscal"},
    {"code": "documents:read", "display_name": "Visualizar documentos", "module": "documents"},
    {"code": "documents:write", "display_name": "Criar/editar documentos", "module": "documents"},
]

SUPERADMIN_PERMISSIONS = [p["code"] for p in PERMISSIONS]

ADMIN_PERMISSIONS = [p["code"] for p in PERMISSIONS if p["code"] not in ("roles:write",)]

GESTOR_PERMISSIONS = [
    "dashboard:read", "customers:read", "customers:write",
    "fleet:read", "fleet:write", "drivers:read", "drivers:write",
    "operations:read", "operations:write", "maintenance:read", "maintenance:write",
    "inventory:read", "inventory:write",
]

OPERADOR_PERMISSIONS = [
    "dashboard:read", "fleet:read", "drivers:read",
    "operations:read", "operations:write", "maintenance:read",
]

FINANCEIRO_PERMISSIONS = [
    "dashboard:read", "finance:read", "finance:write",
    "fiscal:read", "fiscal:write", "suppliers:read",
]

ROLE_PERMISSIONS_MAP = {
    "superadmin": SUPERADMIN_PERMISSIONS,
    "admin": ADMIN_PERMISSIONS,
    "gestor": GESTOR_PERMISSIONS,
    "operador": OPERADOR_PERMISSIONS,
    "financeiro": FINANCEIRO_PERMISSIONS,
    "motorista": ["dashboard:read"],
    "cliente": [],
}


async def seed_database() -> None:
    engine = create_async_engine(settings.database_url)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with session_factory() as db:
        existing_roles = await db.execute(select(Role))
        if existing_roles.scalars().first():
            print("Database already seeded. Skipping.")
            await engine.dispose()
            return

        role_map: dict[str, uuid.UUID] = {}
        for role_data in ROLES:
            role = Role(**role_data)
            db.add(role)
            await db.flush()
            role_map[role.name] = role.id

        perm_map: dict[str, uuid.UUID] = {}
        for perm_data in PERMISSIONS:
            perm = Permission(**perm_data)
            db.add(perm)
            await db.flush()
            perm_map[perm.code] = perm.id

        for role_name, perm_codes in ROLE_PERMISSIONS_MAP.items():
            for code in perm_codes:
                if code in perm_map and role_name in role_map:
                    db.add(RolePermission(
                        role_id=role_map[role_name],
                        permission_id=perm_map[code],
                    ))

        superadmin = User(
            email="admin@santaritadiesel.com",
            full_name="Administrador do Sistema",
            password_hash=hash_password("admin@SRD2026!"),
            role_id=role_map["superadmin"],
            is_active=True,
        )
        db.add(superadmin)

        await db.commit()
        print("Database seeded successfully!")
        print(f"  - {len(ROLES)} roles created")
        print(f"  - {len(PERMISSIONS)} permissions created")
        print(f"  - Superadmin: admin@santaritadiesel.com / admin@SRD2026!")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_database())
