-- ============================================================
-- Fix Security Advisor warnings
-- 1. Add security_invoker to 4 views (bypass RLS fix)
-- 2. Enable RLS on session_blocklist
-- 3. Remove user_metadata from profiles RLS policy
-- ============================================================

-- 1. Views: force RLS of underlying tables to be respected
ALTER VIEW public.vw_alunos_matriculados SET (security_invoker = true);
ALTER VIEW public.vw_frequencia_alunos SET (security_invoker = true);
ALTER VIEW public.vw_notas_alunos SET (security_invoker = true);
ALTER VIEW public.vw_professores_disciplinas SET (security_invoker = true);

-- 2. Enable RLS on session_blocklist (only accessible via SECURITY DEFINER functions)
ALTER TABLE public.session_blocklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "block direct access" ON public.session_blocklist
  FOR ALL TO authenticated
  USING (false)
  WITH CHECK (false);

-- 3. Fix profiles SELECT policy: remove user_metadata (editable by end users),
--    keep only app_metadata which is secure
DROP POLICY IF EXISTS "Admin staff can view all profiles" ON public.profiles;

CREATE POLICY "Admin staff can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'tipo_usuario') = ANY (ARRAY['admin'::text, 'diretor'::text, 'secretaria'::text, 'coordenacao'::text])
  );
