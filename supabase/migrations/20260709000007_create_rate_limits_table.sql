-- Tabela para rate limiting distribuído (funciona em serverless)
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  reset_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at ON public.rate_limits (reset_at);

-- Função atomica de rate limit (evita race conditions)
CREATE OR REPLACE FUNCTION public.rate_limit_check(
  p_key TEXT,
  p_max_requests INT,
  p_window_sec INT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INT;
  v_reset_at TIMESTAMPTZ;
  v_now TIMESTAMPTZ := NOW();
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Limpeza oportunista de entradas expiradas
  DELETE FROM public.rate_limits WHERE reset_at < v_now;

  -- Buscar entrada existente
  SELECT count, reset_at INTO v_count, v_reset_at
  FROM public.rate_limits
  WHERE key = p_key;

  v_expires_at := v_now + (p_window_sec || ' seconds')::INTERVAL;

  IF NOT FOUND OR v_reset_at < v_now THEN
    -- Primeira requisição ou janela expirou
    INSERT INTO public.rate_limits (key, count, reset_at)
    VALUES (p_key, 1, v_expires_at)
    ON CONFLICT (key) DO UPDATE
    SET count = 1, reset_at = v_expires_at;

    RETURN jsonb_build_object('success', true, 'remaining', p_max_requests - 1);
  ELSIF v_count >= p_max_requests THEN
    RETURN jsonb_build_object('success', false, 'remaining', 0);
  ELSE
    UPDATE public.rate_limits
    SET count = count + 1
    WHERE key = p_key;

    RETURN jsonb_build_object('success', true, 'remaining', p_max_requests - v_count - 1);
  END IF;
END;
$$;
