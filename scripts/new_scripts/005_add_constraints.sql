-- Adicionar constraints de validação se não existirem

-- Constraint para status de matrícula
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'matriculas_status_check'
    ) THEN
        ALTER TABLE matriculas 
        ADD CONSTRAINT matriculas_status_check 
        CHECK (status IN ('ativa', 'cancelada', 'concluida', 'trancada'));
    END IF;
END $$;

-- Constraint para role em profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_role_check'
    ) THEN
        ALTER TABLE profiles 
        ADD CONSTRAINT profiles_role_check 
        CHECK (role IN ('admin', 'professor', 'aluno', 'responsavel'));
    END IF;
END $$;

-- Constraint para tipo_usuario em profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_tipo_usuario_check'
    ) THEN
        ALTER TABLE profiles 
        ADD CONSTRAINT profiles_tipo_usuario_check 
        CHECK (tipo_usuario IN ('admin', 'professor', 'aluno', 'responsavel'));
    END IF;
END $$;

-- Constraint para turno em turmas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'turmas_turno_check'
    ) THEN
        ALTER TABLE turmas 
        ADD CONSTRAINT turmas_turno_check 
        CHECK (turno IN ('matutino', 'vespertino', 'noturno', 'integral'));
    END IF;
END $$;

-- Constraint para tipo_evento em eventos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'eventos_tipo_check'
    ) THEN
        ALTER TABLE eventos 
        ADD CONSTRAINT eventos_tipo_check 
        CHECK (tipo_evento IN ('prova', 'trabalho', 'reuniao', 'evento_escolar', 'feriado', 'outro'));
    END IF;
END $$;

-- Constraint para nota (0 a 10)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'notas_nota_range_check'
    ) THEN
        ALTER TABLE notas 
        ADD CONSTRAINT notas_nota_range_check 
        CHECK (nota >= 0 AND nota <= 10);
    END IF;
END $$;

-- Constraint para bimestre (1 a 4)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'notas_bimestre_check'
    ) THEN
        ALTER TABLE notas 
        ADD CONSTRAINT notas_bimestre_check 
        CHECK (bimestre BETWEEN 1 AND 4);
    END IF;
END $$;
