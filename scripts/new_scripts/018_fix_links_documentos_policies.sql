-- Fix RLS policies for links_documentos table
-- This allows admins, coordenacao, secretaria, and diretor to manage document links

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "links_documentos_select_authenticated" ON links_documentos;
DROP POLICY IF EXISTS "links_documentos_insert_allowed" ON links_documentos;
DROP POLICY IF EXISTS "links_documentos_update_allowed" ON links_documentos;
DROP POLICY IF EXISTS "links_documentos_delete_allowed" ON links_documentos;

-- Create SELECT policy (all authenticated users can view)
CREATE POLICY "links_documentos_select_authenticated" 
ON links_documentos FOR SELECT 
TO authenticated 
USING (true);

-- Create INSERT policy (only admin, coordenacao, secretaria, diretor)
CREATE POLICY "links_documentos_insert_allowed" 
ON links_documentos FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND LOWER(profiles.tipo_usuario) IN ('admin', 'coordenacao', 'secretaria', 'diretor')
  )
);

-- Create UPDATE policy (only admin, coordenacao, secretaria, diretor)
CREATE POLICY "links_documentos_update_allowed" 
ON links_documentos FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND LOWER(profiles.tipo_usuario) IN ('admin', 'coordenacao', 'secretaria', 'diretor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND LOWER(profiles.tipo_usuario) IN ('admin', 'coordenacao', 'secretaria', 'diretor')
  )
);

-- Create DELETE policy (only admin, coordenacao, secretaria, diretor)
CREATE POLICY "links_documentos_delete_allowed" 
ON links_documentos FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND LOWER(profiles.tipo_usuario) IN ('admin', 'coordenacao', 'secretaria', 'diretor')
  )
);
