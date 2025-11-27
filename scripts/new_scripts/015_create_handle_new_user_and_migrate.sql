-- =====================================================
-- CRIAR FUNÇÃO PARA SINCRONIZAR USUÁRIOS COM PROFILES
-- =====================================================

-- Remover função antiga se existir
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Criar função que será chamada pela trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Inserir novo perfil usando os dados do metadata do auth.users
  INSERT INTO public.profiles (
    id,
    email,
    nome_completo,
    telefone,
    tipo_usuario,
    ativo,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', ''),
    COALESCE(NEW.raw_user_meta_data->>'telefone', ''),
    COALESCE(NEW.raw_user_meta_data->>'tipo_usuario', 'professor'),
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nome_completo = EXCLUDED.nome_completo,
    telefone = EXCLUDED.telefone,
    tipo_usuario = EXCLUDED.tipo_usuario,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Comentar a função
COMMENT ON FUNCTION public.handle_new_user() IS 'Cria automaticamente um perfil quando um novo usuário é registrado no auth.users';

-- =====================================================
-- RECRIAR TRIGGER NA TABELA auth.users
-- =====================================================

-- Remover trigger antiga se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar trigger que chama a função após inserir usuário
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- MIGRAR USUÁRIOS EXISTENTES DO auth.users PARA profiles
-- =====================================================

-- Inserir todos os usuários existentes que ainda não têm perfil
INSERT INTO public.profiles (
  id,
  email,
  nome_completo,
  telefone,
  tipo_usuario,
  ativo,
  created_at,
  updated_at
)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'nome_completo', '') as nome_completo,
  COALESCE(u.raw_user_meta_data->>'telefone', '') as telefone,
  COALESCE(u.raw_user_meta_data->>'tipo_usuario', 'professor') as tipo_usuario,
  true as ativo,
  u.created_at,
  NOW() as updated_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Contar quantos usuários foram migrados
DO $$
DECLARE
  user_count INTEGER;
  profile_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users;
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  
  RAISE NOTICE 'Migração concluída!';
  RAISE NOTICE 'Usuários no auth.users: %', user_count;
  RAISE NOTICE 'Perfis criados em profiles: %', profile_count;
END $$;
