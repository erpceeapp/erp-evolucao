-- Adicionar políticas RLS para config_campos_obrigatorios
-- Apenas admins, coordenacao, secretaria e diretor podem gerenciar

-- Remover política antiga se existir
DROP POLICY IF EXISTS "config_campos_update_allowed" ON config_campos_obrigatorios;
DROP POLICY IF EXISTS "config_campos_insert_allowed" ON config_campos_obrigatorios;
DROP POLICY IF EXISTS "config_campos_delete_allowed" ON config_campos_obrigatorios;

-- Criar política de UPDATE
CREATE POLICY "config_campos_update_allowed"
ON config_campos_obrigatorios
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND LOWER(profiles.tipo_usuario) IN ('admin', 'coordenacao', 'secretaria', 'diretor')
  )
);

-- Criar política de INSERT
CREATE POLICY "config_campos_insert_allowed"
ON config_campos_obrigatorios
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND LOWER(profiles.tipo_usuario) IN ('admin', 'coordenacao', 'secretaria', 'diretor')
  )
);

-- Criar política de DELETE
CREATE POLICY "config_campos_delete_allowed"
ON config_campos_obrigatorios
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND LOWER(profiles.tipo_usuario) IN ('admin', 'coordenacao', 'secretaria', 'diretor')
  )
);
