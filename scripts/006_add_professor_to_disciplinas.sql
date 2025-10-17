-- Adiciona coluna professor_id na tabela disciplinas
-- Permite atribuir um professor responsável a cada disciplina

ALTER TABLE disciplinas
ADD COLUMN professor_id UUID REFERENCES professores(id) ON DELETE SET NULL;

-- Adiciona índice para melhorar performance de queries
CREATE INDEX idx_disciplinas_professor_id ON disciplinas(professor_id);

-- Adiciona comentário explicativo
COMMENT ON COLUMN disciplinas.professor_id IS 'Professor responsável pela disciplina';
