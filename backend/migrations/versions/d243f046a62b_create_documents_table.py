"""create documents table

Revision ID: d243f046a62b
Revises: 51fba7fd95da
Create Date: 2026-04-17 17:30:33.350632
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = '<mantenha o id gerado>'
down_revision = '51fba7fd95da'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'documents',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('file_name', sa.String(300), nullable=False),
        sa.Column('original_name', sa.String(300), nullable=False),
        sa.Column('content_type', sa.String(100), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('storage_key', sa.String(500), nullable=False, unique=True),
        sa.Column('category', sa.String(50), nullable=False, server_default='other'),
        sa.Column('description', sa.String(500), nullable=True),
        sa.Column('entity_type', sa.String(30), nullable=True),
        sa.Column('entity_id', sa.String(50), nullable=True),
        sa.Column('uploaded_by', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_documents_id', 'documents', ['id'])
    op.create_index('ix_documents_category', 'documents', ['category'])
    op.create_index('ix_documents_entity_type', 'documents', ['entity_type'])
    op.create_index('ix_documents_entity_id', 'documents', ['entity_id'])


def downgrade() -> None:
    op.drop_index('ix_documents_entity_id', 'documents')
    op.drop_index('ix_documents_entity_type', 'documents')
    op.drop_index('ix_documents_category', 'documents')
    op.drop_index('ix_documents_id', 'documents')
    op.drop_table('documents')