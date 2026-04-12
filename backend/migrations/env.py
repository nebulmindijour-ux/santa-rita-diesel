import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config

from src.core.config import get_settings
from src.core.database import Base

from src.modules.iam.domain.models import (  # noqa: F401
    AuditLog, Permission, RefreshToken, Role, RolePermission, User,
)
from src.modules.customers.domain.models import Customer, Supplier  # noqa: F401
from src.modules.fleet.domain.models import Vehicle  # noqa: F401
from src.modules.drivers.domain.models import Driver  # noqa: F401
from src.modules.operations.domain.models import Operation  # noqa: F401

settings = get_settings()
config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

EXCLUDE_TABLES = {
    "spatial_ref_sys", "geometry_columns", "geography_columns",
    "raster_columns", "raster_overviews", "topology", "layer",
    "geocode_settings", "geocode_settings_default", "loader_platform",
    "loader_variables", "loader_lookuptables", "pagc_gaz", "pagc_lex",
    "pagc_rules", "county_lookup", "countysub_lookup", "place_lookup",
    "state_lookup", "zip_lookup", "zip_lookup_all", "zip_lookup_base",
    "zip_state", "zip_state_loc", "secondary_unit_lookup",
    "street_type_lookup", "direction_lookup", "state", "county", "cousub",
    "place", "edges", "faces", "featnames", "addr", "addrfeat", "tract",
    "tabblock", "tabblock20", "bg", "zcta5",
}


def include_object(object, name, type_, reflected, compare_to):
    if type_ == "table" and name in EXCLUDE_TABLES:
        return False
    if type_ == "index" and getattr(object, "table", None) is not None:
        if object.table.name in EXCLUDE_TABLES:
            return False
    return True


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True, dialect_opts={"paramstyle": "named"}, include_object=include_object)
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):  # type: ignore[no-untyped-def]
    context.configure(connection=connection, target_metadata=target_metadata, include_object=include_object)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = async_engine_from_config(config.get_section(config.config_ini_section, {}), prefix="sqlalchemy.", poolclass=pool.NullPool)
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
