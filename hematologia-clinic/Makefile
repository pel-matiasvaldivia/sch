.PHONY: up down build migrate seed test lint shell-backend shell-db logs clean

# ─── Arrancar entorno de desarrollo ───
up:
	docker compose up -d
	@echo "✓ Servicios iniciados. Backend: http://localhost/api/docs"

# ─── Detener todo ───
down:
	docker compose down

# ─── Reconstruir imágenes ───
build:
	docker compose build --no-cache

# ─── Ejecutar migraciones ───
migrate:
	docker compose exec backend alembic upgrade head

# ─── Crear nueva migración (uso: make migration name="descripcion") ───
migration:
	docker compose exec backend alembic revision --autogenerate -m "$(name)"

# ─── Poblar la base con datos de desarrollo ───
seed:
	docker compose exec backend python -m app.scripts.seed_dev

# ─── Tests ───
test:
	docker compose exec backend pytest tests/ -v --cov=app --cov-report=term-missing

# ─── Linting y formato ───
lint:
	docker compose exec backend ruff check app/
	docker compose exec backend ruff format --check app/

format:
	docker compose exec backend ruff format app/
	docker compose exec backend ruff check --fix app/

# ─── Shell interactivo ───
shell-backend:
	docker compose exec backend bash

shell-db:
	docker compose exec postgres psql -U $$POSTGRES_USER -d $$POSTGRES_DB

# ─── Ver logs en tiempo real ───
logs:
	docker compose logs -f backend worker

# ─── Limpiar todo (cuidado: borra volúmenes) ───
clean:
	docker compose down -v --remove-orphans
	@echo "⚠ Todos los datos eliminados."
