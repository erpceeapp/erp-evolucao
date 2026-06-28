-- Revoga GRANT EXECUTE TO anon das funcoes SECURITY DEFINER do responsavel
-- Estas funcoes devem ser chamadas apenas do servidor (via service_role)
-- ou por usuarios autenticados

-- 20260621000000_responsavel_rpc.sql
REVOKE EXECUTE ON FUNCTION public.buscar_aluno_responsavel FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_matricula_ativa FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_turma FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_avisos_aluno FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_aluno_notas FROM anon;

-- 20260621000001_responsavel_rpc_pages.sql
REVOKE EXECUTE ON FUNCTION public.get_aluno_basico FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_escola FROM anon;

-- 20260621000002_responsavel_blocklist.sql
REVOKE EXECUTE ON FUNCTION public.revogar_sessoes_responsavel FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_ultima_revogacao FROM anon;
