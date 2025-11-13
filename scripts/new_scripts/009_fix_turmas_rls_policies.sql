-- Fix turmas RLS policies - Remove duplicates and conflicts
-- This solves the 500 error when querying turmas table

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view turmas" ON turmas;
DROP POLICY IF EXISTS "turmas_select_authenticated" ON turmas;
DROP POLICY IF EXISTS "turmas_insert_authenticated" ON turmas;
DROP POLICY IF EXISTS "turmas_update_authenticated" ON turmas;
DROP POLICY IF EXISTS "turmas_delete_authenticated" ON turmas;
DROP POLICY IF EXISTS "Admin and secretaria can manage turmas" ON turmas;

-- Create clean, non-conflicting policies
CREATE POLICY "turmas_select_all_authenticated"
ON turmas FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "turmas_insert_admin_coord"
ON turmas FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'coordenador')
  )
);

CREATE POLICY "turmas_update_admin_coord"
ON turmas FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'coordenador')
  )
);

CREATE POLICY "turmas_delete_admin_coord"
ON turmas FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'coordenador')
  )
);
