BEGIN;

-- Ordem de delecao respeitando FK dependencies:
-- matriculas FK -> alunos, turmas
-- turma_disciplinas FK -> turmas
-- turmas FK -> professores
-- professores FK -> profiles
-- profiles FK -> auth.users

DELETE FROM public.matriculas;
DELETE FROM public.turma_disciplinas;
DELETE FROM public.turmas;
DELETE FROM public.professores;
DELETE FROM public.alunos;
DELETE FROM public.profiles;

DELETE FROM auth.users;

COMMIT;
