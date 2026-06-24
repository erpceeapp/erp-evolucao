-- Atualiza RPC buscar_aluno_responsavel para comparar CPF sem formatacao
CREATE OR REPLACE FUNCTION public.buscar_aluno_responsavel(
  p_email TEXT,
  p_cpf TEXT
)
RETURNS TABLE (
  id UUID,
  nome_completo TEXT,
  cpf TEXT,
  email_responsavel TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.nome_completo, a.cpf, a.email_responsavel
  FROM alunos a
  WHERE a.email_responsavel ILIKE p_email
    AND REGEXP_REPLACE(a.cpf, '[^0-9]', '', 'g') = p_cpf
    AND a.ativo = true
  LIMIT 1;
END;
$$;
