-- Remove políticas duplicadas e problemáticas
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;

-- Manter apenas as políticas necessárias e sem recursão
-- Política para permitir usuários verem seus próprios perfis
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Política para permitir usuários atualizarem seus próprios perfis
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Política para admin ver todos os perfis
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
CREATE POLICY "Admin can view all profiles" ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Política para admin atualizar todos os perfis
DROP POLICY IF EXISTS "Admin can update all profiles" ON profiles;
CREATE POLICY "Admin can update all profiles" ON profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Política para permitir inserção de novos perfis (SEM RECURSÃO)
DROP POLICY IF EXISTS "Sistema pode inserir perfis" ON profiles;
CREATE POLICY "Sistema pode inserir perfis" ON profiles
  FOR INSERT
  WITH CHECK (true); -- Permite inserção sem verificação recursiva

-- Criar ou substituir função de trigger para criar perfis automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Inserir novo perfil com dados do usuário
  INSERT INTO public.profiles (id, nome_completo, email, telefone, role, tipo_usuario, ativo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', 'Usuário'),
    NEW.email,
    NEW.raw_user_meta_data->>'telefone',
    COALESCE(NEW.raw_user_meta_data->>'tipo_usuario', 'secretaria'),
    COALESCE(NEW.raw_user_meta_data->>'tipo_usuario', 'secretaria'),
    true
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Se o perfil já existe, apenas retornar
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log do erro mas não falhar a autenticação
    RAISE WARNING 'Erro ao criar perfil: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar trigger para executar a função quando um novo usuário é criado
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Comentários para documentação
COMMENT ON FUNCTION public.handle_new_user() IS 'Cria automaticamente um perfil quando um novo usuário se registra';
COMMENT ON POLICY "Sistema pode inserir perfis" ON profiles IS 'Permite inserção de perfis sem verificação recursiva';
