# Guía de Despliegue — Sistema Hematología

## Requisitos previos

- Docker Engine 24+ y Docker Compose 2.20+
- Git
- 4GB RAM mínimo en el servidor
- Puerto 80 (y 443 en producción)

---

## Inicio rápido (Desarrollo)

```bash
# 1. Clonar el repositorio
git clone <url-repo> hematologia-clinic
cd hematologia-clinic

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con valores seguros

# 3. Levantar todos los servicios
make up
# o: docker compose up -d

# 4. Ejecutar migraciones
make migrate
# o: docker compose exec backend alembic upgrade head

# 5. Poblar con datos de prueba
make seed

# 6. Verificar que todo funciona
curl http://localhost/health
```

**URLs en desarrollo:**
- Frontend: http://localhost
- Backend API: http://localhost/api/docs (Swagger)
- MinIO Console: http://localhost:9001
- Flower (Celery monitor): http://localhost:5555

---

## Variables de entorno requeridas

Todas están documentadas en `.env.example`. Las críticas son:

| Variable | Descripción |
|---|---|
| `APP_SECRET_KEY` | Secreto de 32+ chars para la app |
| `JWT_SECRET_KEY` | Secreto de 64+ chars para JWT |
| `POSTGRES_PASSWORD` | Contraseña segura para PostgreSQL |
| `REDIS_PASSWORD` | Contraseña para Redis |
| `MINIO_ROOT_PASSWORD` | Contraseña para MinIO |

---

## Primer uso

Al iniciar por primera vez, el sistema crea los roles del sistema automáticamente.
Luego ejecutar el seed para crear el usuario admin:

```bash
make seed
```

Credenciales iniciales:
- Admin: `admin@clinica.com` / `Admin1234!`
- Médico: `medico@clinica.com` / `Medico1234!`

**Cambiar estas contraseñas inmediatamente en producción.**

---

## Comandos útiles

```bash
# Ver logs en tiempo real
make logs

# Correr tests
make test

# Crear nueva migración
make migration name="agregar_campo_x_a_pacientes"

# Shell en el contenedor backend
make shell-backend

# Shell en PostgreSQL
make shell-db

# Limpiar todo (¡borra datos!)
make clean
```

---

## Arquitectura de contenedores

```
Internet
    │
    ▼
  Nginx (80/443)
    │
    ├─── /api/* ──────► FastAPI Backend (:8000)
    │                       │
    └─── /* ──────────► Next.js Frontend (:3000)
                             │
    Servicios internos:      │
    PostgreSQL (:5432) ◄─────┤
    Redis (:6379) ◄──────────┤
    Elasticsearch (:9200) ◄──┤
    MinIO (:9000) ◄──────────┤
    Celery Worker ◄──────────┘
```

---

## Producción

Para producción, usar `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d`.

### SSL con Let's Encrypt

1. Configurar el dominio en `infra/nginx/nginx.prod.conf`
2. Obtener certificado: `certbot certonly --webroot -w /var/www/certbot -d tu-dominio.com`
3. Copiar certs a `infra/nginx/ssl/`
4. Reiniciar nginx
