-- Adicionar triggers de updated_at para tabelas que podem não ter

-- Verificar e adicionar trigger para alunos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_alunos_updated_at'
    ) THEN
        CREATE TRIGGER update_alunos_updated_at
            BEFORE UPDATE ON alunos
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Verificar e adicionar trigger para professores
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_professores_updated_at'
    ) THEN
        CREATE TRIGGER update_professores_updated_at
            BEFORE UPDATE ON professores
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Verificar e adicionar trigger para turmas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_turmas_updated_at'
    ) THEN
        CREATE TRIGGER update_turmas_updated_at
            BEFORE UPDATE ON turmas
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Verificar e adicionar trigger para disciplinas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_disciplinas_updated_at'
    ) THEN
        CREATE TRIGGER update_disciplinas_updated_at
            BEFORE UPDATE ON disciplinas
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Verificar e adicionar trigger para matriculas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_matriculas_updated_at'
    ) THEN
        CREATE TRIGGER update_matriculas_updated_at
            BEFORE UPDATE ON matriculas
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Verificar e adicionar trigger para notas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_notas_updated_at'
    ) THEN
        CREATE TRIGGER update_notas_updated_at
            BEFORE UPDATE ON notas
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Verificar e adicionar trigger para aulas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_aulas_updated_at'
    ) THEN
        CREATE TRIGGER update_aulas_updated_at
            BEFORE UPDATE ON aulas
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Verificar e adicionar trigger para eventos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_eventos_updated_at'
    ) THEN
        CREATE TRIGGER update_eventos_updated_at
            BEFORE UPDATE ON eventos
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Verificar e adicionar trigger para escola
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_escola_updated_at'
    ) THEN
        CREATE TRIGGER update_escola_updated_at
            BEFORE UPDATE ON escola
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Verificar e adicionar trigger para profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_profiles_updated_at'
    ) THEN
        CREATE TRIGGER update_profiles_updated_at
            BEFORE UPDATE ON profiles
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
