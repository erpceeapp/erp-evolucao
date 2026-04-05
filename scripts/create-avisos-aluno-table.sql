-- Criar tabela de avisos do aluno (Agenda do Aluno)
CREATE TABLE IF NOT EXISTS avisos_aluno (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo_aviso TEXT NOT NULL DEFAULT 'geral',
  data_aviso DATE NOT NULL DEFAULT CURRENT_DATE,
  hora_aviso TIME,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE avisos_aluno ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "avisos_aluno_select_authenticated" ON avisos_aluno
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "avisos_aluno_insert_authenticated" ON avisos_aluno
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "avisos_aluno_update_authenticated" ON avisos_aluno
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "avisos_aluno_delete_authenticated" ON avisos_aluno
  FOR DELETE TO authenticated USING (true);
