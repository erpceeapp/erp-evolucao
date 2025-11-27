-- Script para corrigir permissões de cadastro de turmas
-- Permite que Secretaria, Coordenação e Diretor possam cadastrar turmas
-- Apenas Professor não pode cadastrar

-- Remover políticas antigas
DROP POLICY IF EXISTS "turmas_insert_admin_coord" ON turmas;
DROP POLICY IF EXISTS "turmas_update_admin_coord" ON turmas;
DROP POLICY IF EXISTS "turmas_delete_admin_coord" ON turmas;

-- Remover função antiga se existir
DROP FUNCTION IF EXISTS user_has_admin_or_coord_role();

-- Criar função para verificar se o usuário pode gerenciar turmas
-- Secretaria, Coordenação e Diretor podem gerenciar
-- Professor não pode
CREATE OR REPLACE FUNCTION user_can_manage_turmas()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
  user_tipo TEXT;
BEGIN
  -- Buscar role e tipo_usuario do perfil
  SELECT role, tipo_usuario INTO user_role, user_tipo
  FROM public.profiles
  WHERE id = auth.uid();
  
  -- Verificar se o usuário pode gerenciar turmas
  -- Pode gerenciar se for: admin, coordenacao, secretaria, diretor
  -- Não pode se for: professor
  RETURN (
    user_role IN ('admin', 'coordenacao', 'secretaria', 'diretor') OR
    user_tipo IN ('Coordenação', 'Secretaria', 'Diretor', 'Admin')
  );
END;
$$;

-- Política de INSERT: Secretaria, Coordenação e Diretor podem inserir
CREATE POLICY "turmas_insert_manage"
ON turmas
FOR INSERT
TO authenticated
WITH CHECK (user_can_manage_turmas());

-- Política de UPDATE: Secretaria, Coordenação e Diretor podem atualizar
CREATE POLICY "turmas_update_manage"
ON turmas
FOR UPDATE
TO authenticated
USING (user_can_manage_turmas())
WITH CHECK (user_can_manage_turmas());

-- Política de DELETE: Secretaria, Coordenação e Diretor podem deletar
CREATE POLICY "turmas_delete_manage"
ON turmas
FOR DELETE
TO authenticated
USING (user_can_manage_turmas());

-- SELECT permanece como está (todos autenticados podem ver)
-- Já existe a política turmas_select_all_authenticated
