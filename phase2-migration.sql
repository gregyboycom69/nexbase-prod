-- Phase 2: Form Designer Database Migration
-- Run this SQL in Supabase SQL Editor

-- Update controls table for form designer
-- Drop old columns and add new ones
ALTER TABLE controls DROP COLUMN IF EXISTS label;
ALTER TABLE controls DROP COLUMN IF EXISTS field_name;
ALTER TABLE controls DROP COLUMN IF EXISTS placeholder;
ALTER TABLE controls DROP COLUMN IF EXISTS required;
ALTER TABLE controls DROP COLUMN IF EXISTS options;
ALTER TABLE controls DROP COLUMN IF EXISTS validation_rules;
ALTER TABLE controls DROP COLUMN IF EXISTS order_index;

-- Add new columns for form designer
ALTER TABLE controls ADD COLUMN IF NOT EXISTS x INTEGER DEFAULT 0;
ALTER TABLE controls ADD COLUMN IF NOT EXISTS y INTEGER DEFAULT 0;
ALTER TABLE controls ADD COLUMN IF NOT EXISTS w INTEGER DEFAULT 100;
ALTER TABLE controls ADD COLUMN IF NOT EXISTS h INTEGER DEFAULT 40;
ALTER TABLE controls ADD COLUMN IF NOT EXISTS props JSONB DEFAULT '{}';
ALTER TABLE controls ADD COLUMN IF NOT EXISTS macro_steps JSONB DEFAULT '[]';
ALTER TABLE controls ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Add published column to workspaces table
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT FALSE;

-- Update pages table display_order column if not exists
ALTER TABLE pages ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_controls_page_id ON controls(page_id);
CREATE INDEX IF NOT EXISTS idx_controls_display_order ON controls(page_id, display_order);
CREATE INDEX IF NOT EXISTS idx_pages_workspace_id ON pages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_pages_display_order ON pages(workspace_id, display_order);

COMMENT ON COLUMN controls.x IS 'X position on canvas in pixels';
COMMENT ON COLUMN controls.y IS 'Y position on canvas in pixels';
COMMENT ON COLUMN controls.w IS 'Width in pixels';
COMMENT ON COLUMN controls.h IS 'Height in pixels';
COMMENT ON COLUMN controls.props IS 'Control properties (caption, colors, fonts, etc)';
COMMENT ON COLUMN controls.macro_steps IS 'Array of macro steps for button actions';
COMMENT ON COLUMN workspaces.published IS 'Whether the workspace is published to public URL';
