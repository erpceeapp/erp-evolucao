-- Fix periodos_letivos RLS policies
-- Adiciona políticas de INSERT, UPDATE e DELETE para a tabela periodos_letivos

-- Drop políticas antigas se existirem
DROP POLICY IF EXISTS "periodos_letivos_insert_allowed" ON periodos_letivos;
DROP POLICY IF EXISTS "periodos_letivos_update_allowed" ON periodos_letivos;
DROP POLICY IF EXISTS "periodos_letivos_delete_allowed" ON periodos_letivos;

-- Criar política de INSERT
-- Apenas admin, coordenacao, secretaria e diretor podem inserir períodos letivos
CREATE POLICY "periodos_letivos_insert_allowed" ON periodos_letivos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo_usuario IN ('admin', 'coordenacao', 'secretaria', 'diretor')
    )
  );

-- Criar política de UPDATE
-- Apenas admin, coordenacao, secretaria e diretor podem atualizar períodos letivos
CREATE POLICY "periodos_letivos_update_allowed" ON periodos_letivos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo_usuario IN ('admin', 'coordenacao', 'secretaria', 'diretor')
    )
  );

-- Criar política de DELETE
-- Apenas admin, coordenacao, secretaria e diretor podem deletar períodos letivos
CREATE POLICY "periodos_letivos_delete_allowed" ON periodos_letivos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo_usuario IN ('admin', 'coordenacao', 'secretaria', 'diretor')
    )
  );
