-- Corrigir políticas RLS da tabela turmas para permitir inserção por admin e coordenação

-- Remove políticas existentes que podem estar causando problemas
DROP POLICY IF EXISTS "turmas_insert_admin_coord" ON turmas;
DROP POLICY IF EXISTS "turmas_update_admin_coord" ON turmas;
DROP POLICY IF EXISTS "turmas_delete_admin_coord" ON turmas;
DROP POLICY IF EXISTS "turmas_select_all_authenticated" ON turmas;

-- Criar função auxiliar para verificar se usuário é admin ou coordenação
-- Esta função evita recursão ao não consultar a tabela profiles durante a verificação de RLS
CREATE OR REPLACE FUNCTION public.user_has_admin_or_coord_role()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'coordenacao')
  );
$$;

-- Política de SELECT: todos os usuários autenticados podem visualizar turmas
CREATE POLICY "turmas_select_all_authenticated"
ON turmas
FOR SELECT
TO authenticated
USING (true);

-- Política de INSERT: apenas admin e coordenação podem inserir turmas
CREATE POLICY "turmas_insert_admin_coord"
ON turmas
FOR INSERT
TO authenticated
WITH CHECK (
  public.user_has_admin_or_coord_role()
);

-- Política de UPDATE: apenas admin e coordenação podem atualizar turmas
CREATE POLICY "turmas_update_admin_coord"
ON turmas
FOR UPDATE
TO authenticated
USING (
  public.user_has_admin_or_coord_role()
)
WITH CHECK (
  public.user_has_admin_or_coord_role()
);

-- Política de DELETE: apenas admin e coordenação podem deletar turmas
CREATE POLICY "turmas_delete_admin_coord"
ON turmas
FOR DELETE
TO authenticated
USING (
  public.user_has_admin_or_coord_role()
);

-- Garantir que RLS está habilitado
ALTER TABLE turmas ENABLE ROW LEVEL SECURITY;

-- Comentários para documentação
COMMENT ON FUNCTION public.user_has_admin_or_coord_role IS 
'Verifica se o usuário atual tem role de admin ou coordenação. Usa SECURITY DEFINER para evitar recursão em políticas RLS.';
