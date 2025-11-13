-- Criar tabela de configuração de campos obrigatórios
CREATE TABLE IF NOT EXISTS public.config_campos_obrigatorios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campo TEXT NOT NULL UNIQUE,
  obrigatorio BOOLEAN NOT NULL DEFAULT false,
  categoria TEXT NOT NULL DEFAULT 'geral',
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_config_campos_obrigatorios_updated_at ON public.config_campos_obrigatorios;
CREATE TRIGGER update_config_campos_obrigatorios_updated_at
  BEFORE UPDATE ON public.config_campos_obrigatorios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.config_campos_obrigatorios ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: apenas admin e coordenador podem gerenciar
DROP POLICY IF EXISTS "config_campos_select_all" ON public.config_campos_obrigatorios;
CREATE POLICY "config_campos_select_all"
  ON public.config_campos_obrigatorios
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "config_campos_manage_admin_coord" ON public.config_campos_obrigatorios;
CREATE POLICY "config_campos_manage_admin_coord"
  ON public.config_campos_obrigatorios
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'coordenador')
    )
  );

-- Inserir configurações padrão
INSERT INTO public.config_campos_obrigatorios (campo, obrigatorio, categoria, ordem) VALUES
  -- Dados Pessoais
  ('nome_completo', true, 'dados_pessoais', 1),
  ('data_nascimento', true, 'dados_pessoais', 2),
  ('cpf', false, 'dados_pessoais', 3),
  ('rg', false, 'dados_pessoais', 4),
  ('sexo', false, 'dados_pessoais', 5),
  ('naturalidade', false, 'dados_pessoais', 6),
  
  -- Contato
  ('telefone', false, 'contato', 7),
  ('email', false, 'contato', 8),
  ('endereco', false, 'contato', 9),
  ('bairro', false, 'contato', 10),
  ('cidade', false, 'contato', 11),
  ('uf', false, 'contato', 12),
  ('cep', false, 'contato', 13),
  
  -- Responsável
  ('nome_responsavel', true, 'responsavel', 14),
  ('telefone_responsavel', true, 'responsavel', 15),
  ('email_responsavel', false, 'responsavel', 16),
  
  -- Filiação
  ('nome_mae', false, 'filiacao', 17),
  ('nome_pai', false, 'filiacao', 18),
  ('celular_mae', false, 'filiacao', 19),
  ('celular_pai', false, 'filiacao', 20),
  ('profissao_mae', false, 'filiacao', 21),
  ('profissao_pai', false, 'filiacao', 22),
  
  -- Saúde
  ('alergia_alimento', false, 'saude', 23),
  ('alergia_medicamento', false, 'saude', 24),
  ('uso_medicamento_continuo', false, 'saude', 25),
  
  -- Acadêmico
  ('nivel', true, 'academico', 26),
  ('turno_preferencial', false, 'academico', 27)
ON CONFLICT (campo) DO NOTHING;
