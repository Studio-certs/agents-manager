/*
  # Add project type column to projects table

  1. Changes
    - Add `project_type` column to `projects` table with default value 'team'
    - Update existing rows to have the correct project type
    - Add check constraint to ensure valid project types

  2. Notes
    - Default value set to 'team' for new projects
    - Valid project types are 'personal' and 'team'
    - Ensures data consistency by adding a check constraint
*/

-- Add project_type column if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'projects' 
    AND column_name = 'project_type'
  ) THEN
    ALTER TABLE projects ADD COLUMN project_type text DEFAULT 'team';
    
    -- Add check constraint to ensure valid project types
    ALTER TABLE projects 
    ADD CONSTRAINT projects_project_type_check 
    CHECK (project_type IN ('personal', 'team'));
  END IF;
END $$;