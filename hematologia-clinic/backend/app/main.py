"""
Punto de entrada principal de la aplicación FastAPI.
Configura el app, registra routers, middleware y lifespan.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.config import get_settings
from app.exceptions import register_exception_handlers
import app.db.all_models  # noqa: F401 — registra todos los modelos antes de configurar mappers

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context: inicializa recursos al startup y los cierra al shutdown.
    """
    # ─── Startup ───
    from app.core.redis_client import get_redis_pool
    from app.core.storage import ensure_buckets_exist
    from app.db.session import engine

    # Verificar conexión a Redis
    redis = await get_redis_pool()
    await redis.ping()

    # Crear buckets de MinIO si no existen
    try:
        await ensure_buckets_exist()
    except Exception as e:
        print(f"⚠ MinIO no disponible en startup: {e}")

    # Inicializar roles del sistema (solo si las tablas ya existen)
    try:
        from app.db.session import AsyncSessionLocal
        async with AsyncSessionLocal() as db:
            from app.modules.users.service import UserService
            service = UserService(db)
            await service.initialize_system_roles()
            await db.commit()
        print("✓ Roles del sistema inicializados")
    except Exception as e:
        print(f"⚠ No se pudieron inicializar roles (¿migraciones pendientes?): {e}")

    print(f"✓ {settings.APP_NAME} v{settings.APP_VERSION} iniciado ({settings.APP_ENV})")

    yield  # Aplicación en ejecución

    # ─── Shutdown ───
    await engine.dispose()
    print("✓ Conexiones cerradas correctamente")


def create_app() -> FastAPI:
    """Factory del app FastAPI."""
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="Sistema de gestión para clínica hematológica",
        docs_url="/docs" if settings.is_development else None,
        redoc_url="/redoc" if settings.is_development else None,
        openapi_url="/openapi.json" if settings.is_development else None,
        lifespan=lifespan,
        redirect_slashes=False,
    )

    # ─── Middleware ───
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    if settings.is_production:
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=["*"],  # Configurar con el dominio real en producción
        )

    # ─── Exception handlers ───
    register_exception_handlers(app)

    # ─── Routers ───
    from app.modules.auth.router import router as auth_router
    from app.modules.users.router import router as users_router
    from app.modules.patients.router import router as patients_router
    from app.modules.appointments.router import router as appointments_router
    from app.modules.services.router import router as services_router
    from app.modules.billing.router import router as billing_router
    from app.modules.reports.router import router as reports_router
    from app.modules.dashboard.router import router as dashboard_router

    app.include_router(auth_router)
    app.include_router(users_router)
    app.include_router(patients_router)
    app.include_router(appointments_router)
    app.include_router(services_router)
    app.include_router(billing_router)
    app.include_router(reports_router)
    app.include_router(dashboard_router)

    # Los siguientes módulos se agregan conforme se implementan:
    # from app.modules.notifications.router import router as notifications_router

    # ─── Health check ───
    @app.get("/health", tags=["Sistema"])
    async def health_check():
        return {
            "status": "healthy",
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "environment": settings.APP_ENV,
        }

    return app


app = create_app()
