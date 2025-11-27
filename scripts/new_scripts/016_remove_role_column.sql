-- Script para remover a coluna role e usar apenas tipo_usuario
-- Primeiro, precisamos atualizar/remover funções que dependem de role

-- 1. Remover funções antigas que usam role
DROP FUNCTION IF EXISTS is_admin_or_coord() CASCADE;
DROP FUNCTION IF EXISTS get_user_role() CASCADE;
DROP FUNCTION IF EXISTS user_can_manage_turmas() CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS is_professor() CASCADE;

-- 2. Criar novas funções usando tipo_usuario
CREATE OR REPLACE FUNCTION public.is_admin_or_coord()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND tipo_usuario IN ('admin', 'coordenacao')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_tipo_usuario()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_tipo text;
BEGIN
  SELECT tipo_usuario INTO user_tipo
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN user_tipo;
END;
$$;

CREATE OR REPLACE FUNCTION public.user_can_manage_turmas()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND tipo_usuario IN ('admin', 'coordenacao', 'secretaria', 'diretor')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND tipo_usuario = 'admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_professor()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND tipo_usuario = 'professor'
  );
END;
$$;

-- 3. Atualizar função handle_new_user para não usar role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome_completo, telefone, tipo_usuario, ativo)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'nome_completo', new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'telefone', new.raw_user_meta_data->>'phone', ''),
    COALESCE(new.raw_user_meta_data->>'tipo_usuario', 'professor'),
    true
  );
  RETURN new;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Erro ao criar perfil: %', SQLERRM;
    RETURN new;
END;
$$;

-- 4. Remover a coluna role da tabela profiles
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles DROP COLUMN role CASCADE;
    RAISE NOTICE 'Coluna role removida com sucesso da tabela profiles';
  ELSE
    RAISE NOTICE 'Coluna role já foi removida anteriormente';
  END IF;
END $$;

-- 5. Atualizar a tabela user_invites para usar tipo_usuario em vez de role
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_invites' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE user_invites RENAME COLUMN role TO tipo_usuario;
    RAISE NOTICE 'Coluna role renomeada para tipo_usuario na tabela user_invites';
  END IF;
END $$;

-- 6. Comentários para documentação
COMMENT ON FUNCTION is_admin_or_coord() IS 'Verifica se o usuário atual é admin ou coordenação usando tipo_usuario';
COMMENT ON FUNCTION get_user_tipo_usuario() IS 'Retorna o tipo_usuario do usuário atual';
COMMENT ON FUNCTION user_can_manage_turmas() IS 'Verifica se o usuário pode gerenciar turmas (admin, coordenacao, secretaria, diretor)';
COMMENT ON FUNCTION is_admin() IS 'Verifica se o usuário é admin';
COMMENT ON FUNCTION is_professor() IS 'Verifica se o usuário é professor';
