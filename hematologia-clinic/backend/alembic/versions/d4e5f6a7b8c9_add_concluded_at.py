"""add_concluded_at_to_appointments

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-04-02 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'd4e5f6a7b8c9'
down_revision = 'c3d4e5f6a7b8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('appointments', sa.Column('concluded_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('appointments', 'concluded_at')
