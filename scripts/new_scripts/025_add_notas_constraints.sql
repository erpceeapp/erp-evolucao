-- Adicionar constraint UNIQUE em notas para evitar duplicatas
-- Uma nota por bimestre, por disciplina, por matricula

ALTER TABLE notas
ADD CONSTRAINT notas_unique_matricula_disciplina_bimestre
UNIQUE (matricula_id, disciplina_id, bimestre);

-- Criar índice para melhorar performance de buscas (se não existir)
CREATE INDEX IF NOT EXISTS idx_notas_matricula_disciplina ON notas(matricula_id, disciplina_id);
