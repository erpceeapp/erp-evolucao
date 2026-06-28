-- Tabela para blocklist de tokens JWT do responsavel
-- Permite revogacao individual de sessoes (alem da revogacao em massa por aluno)

CREATE TABLE IF NOT EXISTS public.session_blocklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL,
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_session_blocklist_hash ON public.session_blocklist(token_hash);
CREATE INDEX IF NOT EXISTS idx_session_blocklist_expires ON public.session_blocklist(expires_at);

-- RPC: Verificar se um token foi revogado
CREATE OR REPLACE FUNCTION public.is_token_revoked(p_token_hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.session_blocklist
    WHERE token_hash = p_token_hash
    AND expires_at > NOW()
  );
END;
$$;

-- RPC: Revogar um token especifico
CREATE OR REPLACE FUNCTION public.revoke_token(p_token_hash TEXT, p_aluno_id UUID DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.session_blocklist (token_hash, aluno_id, expires_at)
  VALUES (p_token_hash, p_aluno_id, NOW() + INTERVAL '8 hours');
END;
$$;
