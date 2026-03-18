# Arquitectura del Sistema Hematología

## Decisiones de arquitectura

### FastAPI vs NestJS

Se eligió **FastAPI (Python 3.12)** por:
- Ecosistema Python superior para datos médicos y procesamiento numérico
- SQLAlchemy 2.0 con async nativo es más maduro que TypeORM
- Celery + Redis para tasks async: librería más probada en producción
- OpenAPI auto-generado de alta calidad
- Menor overhead cognitivo para un sistema CRUD-heavy
- Mejor integración con librerías de generación de PDF (ReportLab)

### Arquitectura: Monolito Modular

Se optó por **monolito modular** (no microservicios) porque:
- El equipo es pequeño (clínica mediana)
- Los módulos comparten transacciones de BD frecuentemente
- Evita la complejidad operacional de microservicios
- Fácil de escalar verticalmente con 4GB+ RAM
- Cada módulo puede extraerse a microservicio si crece

### JWT + Redis para sesiones

- Access tokens: JWT stateless (15 min) — no requieren consulta a BD
- Refresh tokens: JWT + hash en Redis (7 días) — permite revocación inmediata
- Login/logout gestionados en API Routes de Next.js (BFF) → cookies httpOnly
- Resultado: tokens nunca expuestos a JavaScript del cliente → protección XSS

### BFF (Backend For Frontend)

Las rutas `/app/api/auth/*` de Next.js actúan como BFF:
- Reciben credenciales del cliente
- Llaman al backend FastAPI
- Almacenan tokens en cookies httpOnly (invisible para JS)
- El browser nunca "ve" los JWT raw

---

## Módulos del sistema

```
app/modules/
├── auth/          Login, refresh, logout, 2FA TOTP
├── users/         CRUD usuarios, roles, permisos
├── patients/      Historia clínica, búsqueda, Elasticsearch
├── appointments/  Turnos, disponibilidad, recordatorios
├── services/      Prestaciones (hemograma, punción, etc.)
├── reports/       Informes PDF, firma digital, acceso tokenizado
├── billing/       Órdenes obras sociales, facturas, pagos
├── notifications/ In-app, email SMTP, WhatsApp Business API
└── audit/         Log inmutable de todas las acciones
```

---

## Flujo de datos principal

```
[Recepción] → Crear/buscar paciente
                   │
                   ▼
            [Módulo Pacientes]
                   │
            ┌──────┴──────┐
            ▼             ▼
       [Turnos]    [Prestaciones]
            │             │
            └──────┬──────┘
                   ▼
             [Informes PDF]
                   │
          ┌────────┴────────┐
          ▼                 ▼
   [Notificaciones]   [Facturación]
   (email/WhatsApp)   (OS/Particular)
```

---

## Base de datos

PostgreSQL 16 con las siguientes extensiones:
- `uuid-ossp`: generación de UUIDs como PKs
- `pgcrypto`: funciones criptográficas
- `unaccent`: búsqueda de nombres sin acentos
- `pg_trgm`: búsqueda por similitud (fuzzy search fallback cuando ES está down)

### Convenciones

- Todas las PKs son UUID strings
- Todos los modelos tienen `created_at`, `updated_at`
- Borrado físico prohibido: usar `deleted_at` (soft-delete)
- Índices en: DNI, apellido, número HC, fecha de turno, user_id en audit_log

---

## Seguridad

| Capa | Mecanismo |
|---|---|
| Transport | HTTPS obligatorio (HSTS en producción) |
| Autenticación | JWT access + refresh con rotación |
| Sesiones | httpOnly cookies (BFF) |
| Autorización | RBAC por rol en cada endpoint |
| Rate limiting | Nginx: 60 req/min general, 10/min en auth |
| Datos sensibles | Soft-delete, no borrado físico |
| Auditoría | Log inmutable de cada acción con IP |
| Contraseñas | bcrypt (cost factor 12) |
| 2FA | TOTP (Google Authenticator compatible) |

---

## Escalabilidad

El sistema está diseñado para escalar en un servidor de 4GB RAM:

| Servicio | RAM estimada |
|---|---|
| PostgreSQL | 512MB |
| Redis | 256MB |
| Elasticsearch | 512MB (single-node) |
| MinIO | 256MB |
| FastAPI (4 workers) | 512MB |
| Next.js | 256MB |
| Celery worker | 256MB |
| Nginx + overhead | 256MB |
| **Total** | ~2.8GB |

Para escalar: aumentar workers de Uvicorn y Celery, o migrar ES a servidor dedicado.
