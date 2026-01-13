-- Adicionar coluna matricula na tabela alunos
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS matricula TEXT UNIQUE;

-- Criar sequência para matrículas
CREATE SEQUENCE IF NOT EXISTS alunos_matricula_seq START WITH 1;

-- Função para gerar matrícula formatada
CREATE OR REPLACE FUNCTION generate_matricula()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_number INTEGER;
  formatted_matricula TEXT;
BEGIN
  -- Obter próximo número da sequência
  next_number := nextval('alunos_matricula_seq');
  
  -- Formatar como string com zeros à esquerda (5 dígitos)
  formatted_matricula := LPAD(next_number::TEXT, 5, '0');
  
  RETURN formatted_matricula;
END;
$$;

-- Trigger para gerar matrícula automaticamente ao inserir aluno
CREATE OR REPLACE FUNCTION set_aluno_matricula()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Se matrícula não foi fornecida, gerar automaticamente
  IF NEW.matricula IS NULL THEN
    NEW.matricula := generate_matricula();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trigger_set_aluno_matricula ON alunos;

-- Criar trigger
CREATE TRIGGER trigger_set_aluno_matricula
  BEFORE INSERT ON alunos
  FOR EACH ROW
  EXECUTE FUNCTION set_aluno_matricula();

-- Atribuir matrículas aos alunos já cadastrados (ordenados por data de criação)
DO $$
DECLARE
  aluno_record RECORD;
BEGIN
  FOR aluno_record IN 
    SELECT id 
    FROM alunos 
    WHERE matricula IS NULL 
    ORDER BY created_at
  LOOP
    UPDATE alunos 
    SET matricula = generate_matricula() 
    WHERE id = aluno_record.id;
  END LOOP;
END $$;

-- Criar índice para melhorar performance de buscas por matrícula
CREATE INDEX IF NOT EXISTS idx_alunos_matricula ON alunos(matricula);

COMMENT ON COLUMN alunos.matricula IS 'Matrícula sequencial do aluno no formato 00001, 00002, etc.';
