ALTER TABLE public.user_invites
  DROP CONSTRAINT IF EXISTS user_invites_role_check,
  ADD CONSTRAINT user_invites_role_check
    CHECK (tipo_usuario = ANY (ARRAY['admin'::text, 'diretor'::text, 'secretaria'::text, 'professor'::text, 'coordenacao'::text]));
