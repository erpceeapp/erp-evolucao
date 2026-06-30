-- RPC: Buscar dados basicos do aluno
CREATE OR REPLACE FUNCTION public.get_aluno_basico(p_aluno_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT to_jsonb(a.*) INTO result
  FROM alunos a
  WHERE a.id = p_aluno_id;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_aluno_basico TO anon;
GRANT EXECUTE ON FUNCTION public.get_aluno_basico TO authenticated;

-- RPC: Buscar escola
CREATE OR REPLACE FUNCTION public.get_escola()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT to_jsonb(e.*) INTO result
  FROM escola e
  LIMIT 1;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_escola TO anon;
GRANT EXECUTE ON FUNCTION public.get_escola TO authenticated;
