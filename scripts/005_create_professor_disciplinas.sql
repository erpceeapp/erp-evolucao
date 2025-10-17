-- Criar tabela de relacionamento entre professores e disciplinas
-- Um professor pode lecionar várias disciplinas
CREATE TABLE IF NOT EXISTS professor_disciplinas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID NOT NULL REFERENCES professores(id) ON DELETE CASCADE,
  disciplina_id UUID NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garantir que não haja duplicatas
  UNIQUE(professor_id, disciplina_id)
);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_professor_disciplinas_professor_id ON professor_disciplinas(professor_id);
CREATE INDEX IF NOT EXISTS idx_professor_disciplinas_disciplina_id ON professor_disciplinas(disciplina_id);

-- Adicionar comentários
COMMENT ON TABLE professor_disciplinas IS 'Relacionamento entre professores e disciplinas que eles podem lecionar';
COMMENT ON COLUMN professor_disciplinas.professor_id IS 'ID do professor';
COMMENT ON COLUMN professor_disciplinas.disciplina_id IS 'ID da disciplina que o professor pode lecionar';

-- Habilitar RLS
ALTER TABLE professor_disciplinas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Permitir leitura de professor_disciplinas para usuários autenticados"
  ON professor_disciplinas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Permitir inserção de professor_disciplinas para usuários autenticados"
  ON professor_disciplinas FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Permitir atualização de professor_disciplinas para usuários autenticados"
  ON professor_disciplinas FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Permitir exclusão de professor_disciplinas para usuários autenticados"
  ON professor_disciplinas FOR DELETE
  TO authenticated
  USING (true);
