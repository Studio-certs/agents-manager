/*
  # Update user role to admin

  1. Changes
    - Updates the role column in profiles table to 'admin' for the current user
    - Ensures the role change triggers the auth role sync

  2. Security
    - Uses RLS policies already in place
    - Maintains role validation constraints
*/

DO $$ 
DECLARE 
  current_user_id UUID;
BEGIN
  -- Get the current user's ID
  current_user_id := auth.uid();
  
  -- Update the user's role to admin
  UPDATE profiles 
  SET role = 'admin'
  WHERE id = current_user_id;
END $$;