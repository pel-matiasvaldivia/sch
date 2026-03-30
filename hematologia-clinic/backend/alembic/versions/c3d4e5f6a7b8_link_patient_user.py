"""link_patient_user

Revision ID: c3d4e5f6a7b8
Revises: a1b2c3d4e5f6
Create Date: 2026-03-30 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'c3d4e5f6a7b8'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('patients', sa.Column('user_id', sa.String(36), nullable=True))
    op.create_unique_constraint('uq_patients_user_id', 'patients', ['user_id'])
    op.create_foreign_key(
        'fk_patients_user_id', 'patients', 'users', ['user_id'], ['id']
    )


def downgrade() -> None:
    op.drop_constraint('fk_patients_user_id', 'patients', type_='foreignkey')
    op.drop_constraint('uq_patients_user_id', 'patients', type_='unique')
    op.drop_column('patients', 'user_id')
