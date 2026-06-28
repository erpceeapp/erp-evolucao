-- Adiciona verificação de role (admin/diretor) nas funções SECURITY DEFINER
-- para evitar account takeover por qualquer usuário autenticado

-- Function para atualizar email do usuario
CREATE OR REPLACE FUNCTION public.admin_update_user_email(
  p_user_id UUID,
  p_new_email TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND tipo_usuario IN ('admin', 'diretor')
  ) THEN
    RAISE EXCEPTION 'access_denied' USING HINT = 'Only administrators can execute this function';
  END IF;

  UPDATE auth.users
  SET email = p_new_email,
      raw_user_meta_data = raw_user_meta_data || jsonb_build_object('email', p_new_email),
      updated_at = NOW()
  WHERE id = p_user_id;

  UPDATE public.profiles
  SET email = p_new_email,
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN FOUND;
END;
$$;

-- Function para atualizar senha do usuario (recebe hash bcrypt)
CREATE OR REPLACE FUNCTION public.admin_update_user_password(
  p_user_id UUID,
  p_encrypted_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND tipo_usuario IN ('admin', 'diretor')
  ) THEN
    RAISE EXCEPTION 'access_denied' USING HINT = 'Only administrators can execute this function';
  END IF;

  UPDATE auth.users
  SET encrypted_password = p_encrypted_password,
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN FOUND;
END;
$$;

-- Function para excluir usuario
CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND tipo_usuario IN ('admin', 'diretor')
  ) THEN
    RAISE EXCEPTION 'access_denied' USING HINT = 'Only administrators can execute this function';
  END IF;

  UPDATE public.avisos_aluno     SET created_by = NULL WHERE created_by = p_user_id;
  UPDATE public.links_documentos SET created_by = NULL WHERE created_by = p_user_id;
  UPDATE public.user_invites     SET invited_by = NULL WHERE invited_by = p_user_id;
  UPDATE public.escola           SET diretor_id = NULL WHERE diretor_id = p_user_id;

  DELETE FROM public.profiles WHERE id = p_user_id;
  DELETE FROM auth.users  WHERE id = p_user_id;
  RETURN FOUND;
END;
$$;

-- Function para atualizar perfil do usuario
CREATE OR REPLACE FUNCTION public.admin_update_user_profile(
  p_user_id UUID,
  p_nome_completo TEXT DEFAULT NULL,
  p_tipo_usuario TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND tipo_usuario IN ('admin', 'diretor')
  ) THEN
    RAISE EXCEPTION 'access_denied' USING HINT = 'Only administrators can execute this function';
  END IF;

  UPDATE public.profiles
  SET
    nome_completo = COALESCE(p_nome_completo, nome_completo),
    tipo_usuario  = COALESCE(p_tipo_usuario, tipo_usuario),
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN FOUND;
END;
$$;
