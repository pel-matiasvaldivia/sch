# ================================================================
# Multi-stage Dockerfile para el backend FastAPI
# ================================================================

# ─── Stage 1: Dependencias base ───
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    libpq-dev \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# ─── Stage 2: Desarrollo ───
FROM base AS development

COPY requirements.txt .
RUN pip install -r requirements.txt

# El código se monta como volumen en desarrollo
EXPOSE 8000

# ─── Stage 3: Builder para producción ───
FROM base AS builder

COPY requirements.txt .
RUN pip install --user -r requirements.txt

# ─── Stage 4: Producción (imagen mínima) ───
FROM python:3.12-slim AS production

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/home/appuser/.local/bin:$PATH"

# Usuario no-root para seguridad
RUN useradd -m -u 1001 appuser

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libpq-dev \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /root/.local /home/appuser/.local
COPY --chown=appuser:appuser . .

USER appuser
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1
