"""remove_password_force

Revision ID: a1b2c3d4e5f6
Revises: 36aa11bb22cc
Create Date: 2026-03-19 22:40:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '36aa11bb22cc'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Set must_change_password to False for all users
    op.execute("UPDATE users SET must_change_password = False")

def downgrade() -> None:
    # We don't really want to go back, but for completeness:
    pass
