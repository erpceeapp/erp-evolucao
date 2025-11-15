-- Criar tabela de períodos letivos/bimestres
CREATE TABLE IF NOT EXISTS public.periodos_letivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ano_letivo INTEGER NOT NULL,
  numero_periodo INTEGER NOT NULL CHECK (numero_periodo IN (1, 2, 3, 4)),
  nome TEXT NOT NULL, -- Ex: "1º Bimestre", "2º Trimestre"
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ano_letivo, numero_periodo)
);

-- Adicionar trigger para updated_at
DROP TRIGGER IF EXISTS update_periodos_letivos_updated_at ON public.periodos_letivos;
CREATE TRIGGER update_periodos_letivos_updated_at
  BEFORE UPDATE ON public.periodos_letivos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.periodos_letivos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS periodos_letivos_select_authenticated ON public.periodos_letivos;
CREATE POLICY periodos_letivos_select_authenticated ON public.periodos_letivos
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS periodos_letivos_manage_admin_coord ON public.periodos_letivos;
CREATE POLICY periodos_letivos_manage_admin_coord ON public.periodos_letivos
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'coordenacao')
    )
  );

-- Inserir períodos padrão para 2025 (se não existirem)
INSERT INTO public.periodos_letivos (ano_letivo, numero_periodo, nome, data_inicio, data_fim)
VALUES 
  (2025, 1, '1º Bimestre', '2025-02-01', '2025-04-30'),
  (2025, 2, '2º Bimestre', '2025-05-01', '2025-07-31'),
  (2025, 3, '3º Bimestre', '2025-08-01', '2025-10-31'),
  (2025, 4, '4º Bimestre', '2025-11-01', '2025-12-20')
ON CONFLICT (ano_letivo, numero_periodo) DO NOTHING;
