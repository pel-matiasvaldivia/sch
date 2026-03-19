"""seed_users

Revision ID: 36aa11bb22cc
Revises: 25994cf444dd
Create Date: 2026-03-19 21:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import uuid
from datetime import datetime
from passlib.context import CryptContext

# revision identifiers, used by Alembic.
revision = '36aa11bb22cc'
down_revision = '25994cf444dd'
branch_labels = None
depends_on = None

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def upgrade() -> None:
    # Obtener la conexión actual
    conn = op.get_bind()

    roles_data = [
        {"name": "admin", "description": "Acceso total al sistema"},
        {"name": "medico", "description": "Acceso a pacientes propios e informes"},
        {"name": "administrativo", "description": "Acceso a turnos y facturación"},
        {"name": "tecnico", "description": "Acceso a carga de resultados técnicos"},
        {"name": "paciente", "description": "Acceso a historial propio"}
    ]

    # Diccionario para guardar el id generado para cada rol
    roles_ids = {}
    now = datetime.utcnow()

    # Insertar los roles si no existen
    for role in roles_data:
        # Check if role exists
        res = conn.execute(sa.text("SELECT id FROM roles WHERE name = :name"), {"name": role["name"]}).fetchone()
        if not res:
            role_id = str(uuid.uuid4())
            conn.execute(
                sa.text("""
                    INSERT INTO roles (id, name, description, is_system, created_at, updated_at) 
                    VALUES (:id, :name, :description, :is_system, :created_at, :updated_at)
                """),
                {
                    "id": role_id,
                    "name": role["name"],
                    "description": role["description"],
                    "is_system": True,
                    "created_at": now,
                    "updated_at": now
                }
            )
            roles_ids[role["name"]] = role_id
        else:
            roles_ids[role["name"]] = res[0]

    users_data = [
        ("admin@hematosys.com.ar", "Admin1234!", "Administrador del Sistema", "admin"),
        ("medico@hematosys.com.ar", "Medico1234!", "Médico Principal", "medico"),
        ("contador@hematosys.com.ar", "Contador1234!", "Contador", "administrativo"),
        ("tecnico@hematosys.com.ar", "Tecnico1234!", "Técnico Laboratorio", "tecnico")
    ]

    for email, password, full_name, role_name in users_data:
        res = conn.execute(sa.text("SELECT id FROM users WHERE email = :email"), {"email": email}).fetchone()
        if not res:
            user_id = str(uuid.uuid4())
            hashed_pw = pwd_context.hash(password)
            
            conn.execute(
                sa.text("""
                    INSERT INTO users (id, email, hashed_password, full_name, is_active, is_email_verified, must_change_password, totp_enabled, failed_login_attempts, created_at, updated_at) 
                    VALUES (:id, :email, :hashed_password, :full_name, :is_active, :is_email_verified, :must_change_password, :totp_enabled, :failed_login_attempts, :created_at, :updated_at)
                """),
                {
                    "id": user_id,
                    "email": email,
                    "hashed_password": hashed_pw,
                    "full_name": full_name,
                    "is_active": True,
                    "is_email_verified": True,
                    "must_change_password": False, # Desactivado por ahora
                    "totp_enabled": False,
                    "failed_login_attempts": 0,
                    "created_at": now,
                    "updated_at": now
                }
            )

            # Insertar user_role
            role_id = roles_ids.get(role_name)
            if role_id:
                conn.execute(
                    sa.text("""
                        INSERT INTO user_roles (user_id, role_id, created_at, updated_at) 
                        VALUES (:user_id, :role_id, :created_at, :updated_at)
                    """),
                    {
                        "user_id": user_id,
                        "role_id": role_id,
                        "created_at": now,
                        "updated_at": now
                    }
                )

def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("DELETE FROM users WHERE email IN ('admin@hematosys.com.ar', 'medico@hematosys.com.ar', 'contador@hematosys.com.ar', 'tecnico@hematosys.com.ar')"))
