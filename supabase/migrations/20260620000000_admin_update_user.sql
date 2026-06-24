-- ============================================================
-- Migration: RPC function para admin atualizar usuarios
-- ============================================================

-- Grant necessario para a function acessar auth.users
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO service_role;

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

-- Function para atualizar senha do usuario
-- Recebe o hash bcrypt ja pronto (gerado pelo servidor Node com bcryptjs)
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
  UPDATE auth.users
  SET encrypted_password = p_encrypted_password,
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN FOUND;
END;
$$;

-- Grant execucao para usuarios autenticados
GRANT EXECUTE ON FUNCTION public.admin_update_user_email TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user_password TO authenticated;

COMMENT ON FUNCTION public.admin_update_user_email IS 'Atualiza o email de um usuario em auth.users e profiles. Apenas admins devem chamar esta funcao.';
COMMENT ON FUNCTION public.admin_update_user_password IS 'Atualiza a senha de um usuario em auth.users usando hash ja gerado. Apenas admins devem chamar esta funcao.';

-- Function para excluir usuario (auth.users + profiles)
-- Antes de deletar, limpa referencias de FKs que bloqueiam a exclusao
CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  UPDATE public.avisos_aluno     SET created_by = NULL WHERE created_by = p_user_id;
  UPDATE public.links_documentos SET created_by = NULL WHERE created_by = p_user_id;
  UPDATE public.user_invites     SET invited_by = NULL WHERE invited_by = p_user_id;
  UPDATE public.escola           SET diretor_id = NULL WHERE diretor_id = p_user_id;

  DELETE FROM public.profiles WHERE id = p_user_id;
  DELETE FROM auth.users  WHERE id = p_user_id;
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_user TO authenticated;

COMMENT ON FUNCTION public.admin_delete_user IS 'Exclui um usuario de auth.users e profiles. Antes limpa referencias FK. Apenas admins devem chamar.';

-- Function para atualizar nome_completo e tipo_usuario no profiles
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
  UPDATE public.profiles
  SET
    nome_completo = COALESCE(p_nome_completo, nome_completo),
    tipo_usuario  = COALESCE(p_tipo_usuario, tipo_usuario),
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_user_profile TO authenticated;

COMMENT ON FUNCTION public.admin_update_user_profile IS 'Atualiza nome_completo e/ou tipo_usuario no profiles. SECURITY DEFINER para bypass de RLS. Apenas admins devem chamar.';
