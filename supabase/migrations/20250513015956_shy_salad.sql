/*
  # Add project_type column to projects table

  1. Changes
    - Adds project_type column to projects table
    - Sets default value to 'team'
    - Adds check constraint for valid values
    - Makes column not nullable
    - Migrates existing rows to have 'team' as project_type
*/

-- Add project_type column if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' 
    AND column_name = 'project_type'
  ) THEN
    -- Add the column
    ALTER TABLE projects 
    ADD COLUMN project_type text;

    -- Set default value for existing rows
    UPDATE projects 
    SET project_type = 'team' 
    WHERE project_type IS NULL;

    -- Make column not nullable and add check constraint
    ALTER TABLE projects
    ALTER COLUMN project_type SET NOT NULL,
    ALTER COLUMN project_type SET DEFAULT 'team',
    ADD CONSTRAINT projects_type_check 
    CHECK (project_type IN ('personal', 'team'));
  END IF;
END $$;