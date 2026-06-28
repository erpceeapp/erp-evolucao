-- Remove GRANT ALL TO anon de tabelas e views
-- RLS ainda protege as tabelas, mas isto reduz superficie de ataque
-- As views contem PII e nao devem ser acessiveis por usuarios nao autenticados

-- Tabelas
REVOKE ALL ON public.alunos FROM anon;
REVOKE ALL ON public.aulas FROM anon;
REVOKE ALL ON public.avisos_aluno FROM anon;
REVOKE ALL ON public.config_campos_obrigatorios FROM anon;
REVOKE ALL ON public.disciplinas FROM anon;
REVOKE ALL ON public.documentos FROM anon;
REVOKE ALL ON public.escola FROM anon;
REVOKE ALL ON public.eventos FROM anon;
REVOKE ALL ON public.links_documentos FROM anon;
REVOKE ALL ON public.matriculas FROM anon;
REVOKE ALL ON public.notas FROM anon;
REVOKE ALL ON public.periodos_letivos FROM anon;
REVOKE ALL ON public.presencas FROM anon;
REVOKE ALL ON public.professor_disciplinas FROM anon;
REVOKE ALL ON public.professores FROM anon;
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.turma_disciplinas FROM anon;
REVOKE ALL ON public.turmas FROM anon;
REVOKE ALL ON public.user_invites FROM anon;

-- Views (contem PII — CPF, telefone, notas)
REVOKE ALL ON public.vw_alunos_matriculados FROM anon;
REVOKE ALL ON public.vw_frequencia_alunos FROM anon;
REVOKE ALL ON public.vw_notas_alunos FROM anon;
REVOKE ALL ON public.vw_professores_disciplinas FROM anon;
