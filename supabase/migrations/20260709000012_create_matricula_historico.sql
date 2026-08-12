-- =============================================================
-- Histórico de matrículas (item 3 do contrato)
-- Tabela imutável de log. Escreve: trigger + funções SECURITY DEFINER.
-- =============================================================

CREATE TABLE public.matricula_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula_id uuid NOT NULL REFERENCES public.matriculas(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('criacao', 'alteracao_status', 'mudanca_turma', 'transferencia')),
  status_anterior text,
  status_novo text,
  turma_anterior uuid REFERENCES public.turmas(id) ON DELETE SET NULL,
  turma_nova uuid REFERENCES public.turmas(id) ON DELETE SET NULL,
  alterado_por uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  alterado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_matricula_historico_matricula ON public.matricula_historico (matricula_id);
CREATE INDEX idx_matricula_historico_alterado_em ON public.matricula_historico (alterado_em DESC);

ALTER TABLE public.matricula_historico ENABLE ROW LEVEL SECURITY;

-- SELECT: apenas membros da staff
CREATE POLICY matricula_historico_select_staff ON public.matricula_historico
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND tipo_usuario IN ('admin', 'diretor', 'secretaria', 'coordenacao', 'professor')
    )
  );

-- Nenhuma política de escrita: o log só é alterado via trigger/funções
-- DEFINER. REVOKE explícito para não conceder nada por padrão.
REVOKE ALL ON public.matricula_historico FROM anon;
REVOKE ALL ON public.matricula_historico FROM authenticated;
GRANT SELECT ON public.matricula_historico TO authenticated;

-- =============================================================
-- Trigger que registra mutações na matrícula
-- =============================================================

CREATE OR REPLACE FUNCTION public.registrar_historico_matricula()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.matricula_historico (
      matricula_id, tipo, status_anterior, status_novo, turma_anterior, turma_nova, alterado_por
    ) VALUES (
      NEW.id, 'criacao', NULL, NEW.status, NULL, NEW.turma_id, auth.uid()
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
     AND (OLD.status IS DISTINCT FROM NEW.status
          OR OLD.turma_id IS DISTINCT FROM NEW.turma_id) THEN

    DECLARE
      -- current_setting vindo da função transferir_matricula() marca o UPDATE
      -- da matrícula antiga como 'transferencia' (set_config local à transação)
      v_tipo TEXT := CASE
        WHEN current_setting('app.transferencia', true) = 'true' THEN 'transferencia'
        WHEN OLD.turma_id IS DISTINCT FROM NEW.turma_id
             AND OLD.status IS DISTINCT FROM NEW.status THEN 'transferencia'
        WHEN OLD.turma_id IS DISTINCT FROM NEW.turma_id THEN 'mudanca_turma'
        ELSE 'alteracao_status'
      END;
    BEGIN

      INSERT INTO public.matricula_historico (
        matricula_id, tipo, status_anterior, status_novo, turma_anterior, turma_nova, alterado_por
      ) VALUES (
        NEW.id, v_tipo, OLD.status, NEW.status, OLD.turma_id, NEW.turma_id, auth.uid()
      );
    END;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER registrar_historico_matricula
  AFTER INSERT OR UPDATE ON public.matriculas
  FOR EACH ROW EXECUTE FUNCTION public.registrar_historico_matricula();