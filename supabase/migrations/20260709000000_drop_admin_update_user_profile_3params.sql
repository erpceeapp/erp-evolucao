-- Drop the 3-parameter overload of admin_update_user_profile
-- The 5-parameter version (with p_telefone, p_email) from
-- 20260628000006_sync_professor_profile.sql remains as the only version.
-- This fixes the ambiguous function call error.
DROP FUNCTION IF EXISTS public.admin_update_user_profile(p_user_id UUID, p_nome_completo TEXT, p_tipo_usuario TEXT);
