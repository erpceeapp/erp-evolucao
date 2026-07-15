-- Fix: get_aluno_basico — retornar apenas colunas necessarias (PII leak fix)
-- Antes: SELECT to_jsonb(a.*) (54 colunas incluindo CPF, RG, endereco,
-- dados medicos, dados do responsavel financeiro, etc.)
-- Depois: apenas colunas efetivamente usadas pelo frontend
CREATE OR REPLACE FUNCTION public.get_aluno_basico(p_aluno_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', a.id,
    'nome_completo', a.nome_completo,
    'cpf', a.cpf,
    'email', a.email,
    'telefone', a.telefone,
    'data_nascimento', a.data_nascimento,
    'nivel', a.nivel,
    'matricula', a.matricula,
    'nome_responsavel', a.nome_responsavel,
    'email_responsavel', a.email_responsavel
  ) INTO result
  FROM alunos a
  WHERE a.id = p_aluno_id;
  RETURN result;
END;
$$;

-- Revogar EXECUTE de revogar_sessoes_responsavel de authenticated
-- Funcao de mutation que pode interromper sessoes de qualquer aluno
-- Deve ser chamada apenas via service_role (createResponsavelClient)
REVOKE EXECUTE ON FUNCTION public.revogar_sessoes_responsavel FROM authenticated;
