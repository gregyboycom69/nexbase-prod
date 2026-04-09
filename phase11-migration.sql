-- Phase 11: Form Designer - Database Migration

-- Add form properties to pages table
ALTER TABLE pages ADD COLUMN IF NOT EXISTS record_source TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS allow_edits BOOLEAN DEFAULT true;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS allow_additions BOOLEAN DEFAULT true;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS allow_deletions BOOLEAN DEFAULT true;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS navigation_buttons BOOLEAN DEFAULT true;

-- Add section column to controls table
ALTER TABLE controls ADD COLUMN IF NOT EXISTS section TEXT DEFAULT 'detail';
