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

-- Garantir que RLS está habilitado
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política 1: Permitir que usuários vejam seu próprio perfil
-- Usa apenas auth.uid() sem consultar a tabela profiles (evita recursão)
CREATE POLICY "profiles_select_own"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Política 2: Permitir que usuários atualizem seu próprio perfil
-- Usa apenas auth.uid() sem consultar a tabela profiles (evita recursão)
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Política 3: Sistema pode inserir perfis durante o cadastro
-- Permite inserção sem verificação (necessário para o trigger handle_new_user)
CREATE POLICY "profiles_insert_system"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política 4: Permitir DELETE apenas para o próprio usuário (opcional)
CREATE POLICY "profiles_delete_own"
ON profiles FOR DELETE
TO authenticated
USING (id = auth.uid());

-- Criar uma função segura para verificar se o usuário é admin/coordenador
-- Esta função usa um recurso especial do PostgreSQL chamado SECURITY DEFINER
-- que permite que a função acesse dados com os privilégios do dono (postgres)
-- sem causar recursão nas políticas RLS
CREATE OR REPLACE FUNCTION auth.is_admin_or_coord()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'coordenacao')
  );
END;
$$;

-- Política 5: Admins e coordenadores podem ver todos os perfis
-- Usa a função SECURITY DEFINER para evitar recursão
CREATE POLICY "profiles_select_admin_coord"
ON profiles FOR SELECT
TO authenticated
USING (
  id = auth.uid() OR auth.is_admin_or_coord()
);

-- Política 6: Admins e coordenadores podem atualizar todos os perfis
-- Usa a função SECURITY DEFINER para evitar recursão
CREATE POLICY "profiles_update_admin_coord"
ON profiles FOR UPDATE
TO authenticated
USING (
  id = auth.uid() OR auth.is_admin_or_coord()
)
WITH CHECK (
  id = auth.uid() OR auth.is_admin_or_coord()
);

-- Comentários explicativos
COMMENT ON POLICY "profiles_select_own" ON profiles IS 
'Permite que usuários vejam apenas seu próprio perfil (sem recursão)';

COMMENT ON POLICY "profiles_update_own" ON profiles IS 
'Permite que usuários atualizem apenas seu próprio perfil (sem recursão)';

COMMENT ON POLICY "profiles_insert_system" ON profiles IS 
'Permite inserção de novos perfis pelo sistema durante o cadastro';

COMMENT ON POLICY "profiles_delete_own" ON profiles IS 
'Permite que usuários deletem apenas seu próprio perfil';

COMMENT ON POLICY "profiles_select_admin_coord" ON profiles IS 
'Permite que admins e coordenadores vejam todos os perfis usando função SECURITY DEFINER';

COMMENT ON POLICY "profiles_update_admin_coord" ON profiles IS 
'Permite que admins e coordenadores atualizem todos os perfis usando função SECURITY DEFINER';
