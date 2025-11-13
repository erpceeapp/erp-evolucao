-- Inserir disciplinas padrão se não existirem
INSERT INTO disciplinas (id, codigo, nome, descricao, carga_horaria, ativo)
VALUES
    (gen_random_uuid(), 'MAT', 'Matemática', 'Disciplina de Matemática', 200, true),
    (gen_random_uuid(), 'PORT', 'Português', 'Disciplina de Língua Portuguesa', 200, true),
    (gen_random_uuid(), 'HIST', 'História', 'Disciplina de História', 120, true),
    (gen_random_uuid(), 'GEO', 'Geografia', 'Disciplina de Geografia', 120, true),
    (gen_random_uuid(), 'CIEN', 'Ciências', 'Disciplina de Ciências', 160, true),
    (gen_random_uuid(), 'EDF', 'Educação Física', 'Disciplina de Educação Física', 80, true),
    (gen_random_uuid(), 'ART', 'Artes', 'Disciplina de Artes', 80, true),
    (gen_random_uuid(), 'ING', 'Inglês', 'Disciplina de Língua Inglesa', 80, true)
ON CONFLICT DO NOTHING;
