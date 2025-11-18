-- Corrigir políticas RLS da tabela profiles para eliminar recursão infinita
-- Este script remove todas as políticas existentes e cria novas políticas simples

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Sistema pode inserir perfis" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_system" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_admin_coord" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin_coord" ON profiles;

-- Garantir que RLS está habilitado
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Criar função no schema public em vez de auth para verificar admin/coordenador
-- Esta função usa SECURITY DEFINER para acessar dados sem causar recursão
CREATE OR REPLACE FUNCTION public.is_admin_or_coord()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'coordenacao')
  );
END;
$$;

-- Comentário sobre a função
COMMENT ON FUNCTION public.is_admin_or_coord() IS 
'Verifica se o usuário atual é admin ou coordenador sem causar recursão nas políticas RLS';

-- Política 1: Permitir que usuários vejam seu próprio perfil
CREATE POLICY "profiles_select_own"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Política 2: Admins e coordenadores podem ver todos os perfis
CREATE POLICY "profiles_select_admin_coord"
ON profiles FOR SELECT
TO authenticated
USING (public.is_admin_or_coord());

-- Política 3: Permitir que usuários atualizem seu próprio perfil
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Política 4: Admins e coordenadores podem atualizar todos os perfis
CREATE POLICY "profiles_update_admin_coord"
ON profiles FOR UPDATE
TO authenticated
USING (public.is_admin_or_coord())
WITH CHECK (public.is_admin_or_coord());

-- Política 5: Sistema pode inserir perfis durante o cadastro
CREATE POLICY "profiles_insert_system"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política 6: Apenas o próprio usuário pode deletar seu perfil
CREATE POLICY "profiles_delete_own"
ON profiles FOR DELETE
TO authenticated
USING (id = auth.uid());

-- Comentários explicativos das políticas
COMMENT ON POLICY "profiles_select_own" ON profiles IS 
'Permite que usuários vejam seu próprio perfil';

COMMENT ON POLICY "profiles_select_admin_coord" ON profiles IS 
'Permite que admins e coordenadores vejam todos os perfis';

COMMENT ON POLICY "profiles_update_own" ON profiles IS 
'Permite que usuários atualizem seu próprio perfil';

COMMENT ON POLICY "profiles_update_admin_coord" ON profiles IS 
'Permite que admins e coordenadores atualizem todos os perfis';

COMMENT ON POLICY "profiles_insert_system" ON profiles IS 
'Permite inserção de novos perfis pelo sistema durante o cadastro';

COMMENT ON POLICY "profiles_delete_own" ON profiles IS 
'Permite que usuários deletem seu próprio perfil';
