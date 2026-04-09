-- Phase 12: Form Designer Fixes - Database Migration

-- Add form type and properties to pages table
ALTER TABLE pages ADD COLUMN IF NOT EXISTS form_type TEXT DEFAULT 'regular';
ALTER TABLE pages ADD COLUMN IF NOT EXISTS record_source TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS allow_edits BOOLEAN DEFAULT true;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS allow_additions BOOLEAN DEFAULT true;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS allow_deletions BOOLEAN DEFAULT true;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS navigation_buttons BOOLEAN DEFAULT true;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS default_view TEXT DEFAULT 'single';

-- Add section column to controls table
ALTER TABLE controls ADD COLUMN IF NOT EXISTS section TEXT DEFAULT 'detail';
