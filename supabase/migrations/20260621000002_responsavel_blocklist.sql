-- Add coluna para rastrear revogacao de sessoes
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS ultima_revogacao_sessao TIMESTAMPTZ;

-- RPC: Revogar todas as sessoes de um responsavel
CREATE OR REPLACE FUNCTION public.revogar_sessoes_responsavel(p_aluno_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE alunos
  SET ultima_revogacao_sessao = NOW()
  WHERE id = p_aluno_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.revogar_sessoes_responsavel TO anon;
GRANT EXECUTE ON FUNCTION public.revogar_sessoes_responsavel TO authenticated;

-- RPC: Obter timestamp da ultima revogacao
CREATE OR REPLACE FUNCTION public.get_ultima_revogacao(p_aluno_id UUID)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result TIMESTAMPTZ;
BEGIN
  SELECT ultima_revogacao_sessao INTO result
  FROM alunos
  WHERE id = p_aluno_id;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_ultima_revogacao TO anon;
GRANT EXECUTE ON FUNCTION public.get_ultima_revogacao TO authenticated;
