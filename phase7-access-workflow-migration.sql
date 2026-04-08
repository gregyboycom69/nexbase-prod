-- Phase 7: Full MS Access Workflow - Database Migration
-- Tables, Queries, Forms, Relationships

-- workspace_tables: Store table definitions (like MS Access tables)
CREATE TABLE IF NOT EXISTS workspace_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  fields JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE workspace_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY owner_tables ON workspace_tables FOR ALL USING (
  workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
);

-- workspace_relationships: Store table relationships (foreign keys)
CREATE TABLE IF NOT EXISTS workspace_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  from_table TEXT,
  from_field TEXT,
  to_table TEXT,
  to_field TEXT,
  relationship_type TEXT DEFAULT 'one-to-many',
  enforce_integrity BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE workspace_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY owner_rel ON workspace_relationships FOR ALL USING (
  workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
);

-- workspace_queries: Store saved queries (like MS Access queries)
CREATE TABLE IF NOT EXISTS workspace_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  definition JSONB,
  sql_preview TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE workspace_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY owner_queries ON workspace_queries FOR ALL USING (
  workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
);

-- Add form binding columns to pages table
ALTER TABLE pages ADD COLUMN IF NOT EXISTS form_type TEXT DEFAULT 'single';
ALTER TABLE pages ADD COLUMN IF NOT EXISTS record_source TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS form_filter TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS order_by TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS allow_edits BOOLEAN DEFAULT true;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS allow_additions BOOLEAN DEFAULT true;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS allow_deletions BOOLEAN DEFAULT true;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_workspace_tables_workspace ON workspace_tables(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_queries_workspace ON workspace_queries(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_relationships_workspace ON workspace_relationships(workspace_id);
