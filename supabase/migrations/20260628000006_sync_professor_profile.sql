-- ============================================================
-- Migration: Sync professor to profile + cascade deletes
-- ============================================================

-- Extends admin_update_user_profile to also sync telefone and email
CREATE OR REPLACE FUNCTION public.admin_update_user_profile(
  p_user_id UUID,
  p_nome_completo TEXT DEFAULT NULL,
  p_tipo_usuario TEXT DEFAULT NULL,
  p_telefone TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    nome_completo = COALESCE(p_nome_completo, nome_completo),
    telefone      = COALESCE(p_telefone, telefone),
    tipo_usuario  = COALESCE(p_tipo_usuario, tipo_usuario),
    email         = COALESCE(p_email, email),
    updated_at = NOW()
  WHERE id = p_user_id;

  IF p_email IS NOT NULL THEN
    UPDATE auth.users
    SET email = p_email,
        raw_user_meta_data = raw_user_meta_data || jsonb_build_object('email', p_email),
        updated_at = NOW()
    WHERE id = p_user_id;
  END IF;

  RETURN FOUND;
END;
$$;

-- Extends admin_delete_user to also delete linked professor row
CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  DELETE FROM public.professores WHERE user_id = p_user_id;

  UPDATE public.avisos_aluno     SET created_by = NULL WHERE created_by = p_user_id;
  UPDATE public.links_documentos SET created_by = NULL WHERE created_by = p_user_id;
  UPDATE public.user_invites     SET invited_by = NULL WHERE invited_by = p_user_id;
  UPDATE public.escola           SET diretor_id = NULL WHERE diretor_id = p_user_id;

  DELETE FROM public.profiles WHERE id = p_user_id;
  DELETE FROM auth.users  WHERE id = p_user_id;
  RETURN FOUND;
END;
$$;
