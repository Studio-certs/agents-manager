/*
  # Add project_type column to projects table

  1. Changes
    - Add project_type column to projects table with 'personal' and 'team' options
    - Set default value to 'team'
    - Add check constraint to ensure valid values
    - Make column not nullable

  2. Notes
    - Uses safe migration pattern with IF NOT EXISTS check
    - Preserves existing data
*/

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'projects' 
    AND column_name = 'project_type'
  ) THEN 
    ALTER TABLE projects 
    ADD COLUMN project_type TEXT CHECK (project_type IN ('personal', 'team')) DEFAULT 'team' NOT NULL;
  END IF;
END $$;