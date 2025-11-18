-- Criar views úteis para relatórios e consultas

-- View de alunos com suas matrículas e turmas
CREATE OR REPLACE VIEW vw_alunos_matriculados AS
SELECT 
    a.id as aluno_id,
    a.nome_completo,
    a.cpf,
    a.email,
    a.telefone,
    m.id as matricula_id,
    m.numero_matricula,
    m.status as status_matricula,
    m.ano_letivo,
    t.id as turma_id,
    t.nome as turma_nome,
    t.serie,
    t.turno
FROM alunos a
LEFT JOIN matriculas m ON a.id = m.aluno_id
LEFT JOIN turmas t ON m.turma_id = t.id
WHERE a.ativo = true;

-- View de professores com suas disciplinas
CREATE OR REPLACE VIEW vw_professores_disciplinas AS
SELECT 
    p.id as professor_id,
    p.nome_completo,
    p.email,
    p.telefone,
    p.formacao,
    p.especializacao,
    d.id as disciplina_id,
    d.nome as disciplina_nome,
    d.codigo as disciplina_codigo
FROM professores p
LEFT JOIN professor_disciplinas pd ON p.id = pd.professor_id
LEFT JOIN disciplinas d ON pd.disciplina_id = d.id
WHERE p.ativo = true;

-- View de notas por aluno e disciplina
CREATE OR REPLACE VIEW vw_notas_alunos AS
SELECT 
    a.id as aluno_id,
    a.nome_completo as aluno_nome,
    t.nome as turma_nome,
    d.nome as disciplina_nome,
    d.codigo as disciplina_codigo,
    n.bimestre,
    n.nota,
    n.tipo_avaliacao,
    n.data_avaliacao,
    m.ano_letivo
FROM alunos a
JOIN matriculas m ON a.id = m.aluno_id
JOIN turmas t ON m.turma_id = t.id
JOIN notas n ON m.id = n.matricula_id
JOIN disciplinas d ON n.disciplina_id = d.id
WHERE a.ativo = true AND m.status = 'ativa';

-- View de frequência por aluno
CREATE OR REPLACE VIEW vw_frequencia_alunos AS
SELECT 
    a.id as aluno_id,
    a.nome_completo as aluno_nome,
    t.nome as turma_nome,
    d.nome as disciplina_nome,
    COUNT(p.id) as total_aulas,
    SUM(CASE WHEN p.presente = true THEN 1 ELSE 0 END) as presencas,
    SUM(CASE WHEN p.presente = false THEN 1 ELSE 0 END) as faltas,
    ROUND(
        (SUM(CASE WHEN p.presente = true THEN 1 ELSE 0 END)::numeric / 
         NULLIF(COUNT(p.id), 0) * 100), 
        2
    ) as percentual_presenca
FROM alunos a
JOIN presencas p ON a.id = p.aluno_id
JOIN aulas au ON p.aula_id = au.id
JOIN turma_disciplinas td ON au.turma_disciplina_id = td.id
JOIN turmas t ON td.turma_id = t.id
JOIN disciplinas d ON td.disciplina_id = d.id
WHERE a.ativo = true
GROUP BY a.id, a.nome_completo, t.nome, d.nome;
