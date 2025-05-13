-- Disable row level security checks temporarily
SET session_replication_role = 'replica';

-- Drop all tables in public schema
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  -- Drop all tables in public schema
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
    EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
  END LOOP;
END $$;

-- Drop all functions in public schema
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  FOR r IN (
    SELECT ns.nspname AS schema_name, p.proname AS function_name, 
           pg_get_function_identity_arguments(p.oid) AS argument_list
    FROM pg_proc p 
    INNER JOIN pg_namespace ns ON p.pronamespace = ns.oid 
    WHERE ns.nspname = 'public'
  ) LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS public.' || 
            quote_ident(r.function_name) || 
            '(' || r.argument_list || ') CASCADE';
  END LOOP;
END $$;

-- Drop all triggers in public schema
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT DISTINCT trigger_name 
    FROM information_schema.triggers 
    WHERE trigger_schema = 'public'
  ) LOOP
    EXECUTE 'DROP TRIGGER IF EXISTS ' || 
            quote_ident(r.trigger_name) || 
            ' ON public.' || 
            quote_ident(r.event_object_table) || 
            ' CASCADE';
  END LOOP;
END $$;

-- Drop all sequences in public schema
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT sequence_name 
    FROM information_schema.sequences 
    WHERE sequence_schema = 'public'
  ) LOOP
    EXECUTE 'DROP SEQUENCE IF EXISTS public.' || 
            quote_ident(r.sequence_name) || 
            ' CASCADE';
  END LOOP;
END $$;

-- Drop storage schema and recreate it
DROP SCHEMA IF EXISTS storage CASCADE;
CREATE SCHEMA storage;

-- Drop auth schema and recreate it
DROP SCHEMA IF EXISTS auth CASCADE;
CREATE SCHEMA auth;

-- Reset the storage bucket
DELETE FROM storage.buckets WHERE id = 'documents';
DELETE FROM storage.objects WHERE bucket_id = 'documents';

-- Re-enable row level security checks
SET session_replication_role = 'origin';