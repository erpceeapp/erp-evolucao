-- Políticas RLS para o ERP Educacional

-- Políticas para profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para alunos (apenas usuários autenticados podem acessar)
CREATE POLICY "alunos_select_authenticated" ON public.alunos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "alunos_insert_authenticated" ON public.alunos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "alunos_update_authenticated" ON public.alunos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "alunos_delete_authenticated" ON public.alunos FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para professores
CREATE POLICY "professores_select_authenticated" ON public.professores FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "professores_insert_authenticated" ON public.professores FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "professores_update_authenticated" ON public.professores FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "professores_delete_authenticated" ON public.professores FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para disciplinas
CREATE POLICY "disciplinas_select_authenticated" ON public.disciplinas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "disciplinas_insert_authenticated" ON public.disciplinas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "disciplinas_update_authenticated" ON public.disciplinas FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "disciplinas_delete_authenticated" ON public.disciplinas FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para turmas
CREATE POLICY "turmas_select_authenticated" ON public.turmas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "turmas_insert_authenticated" ON public.turmas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "turmas_update_authenticated" ON public.turmas FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "turmas_delete_authenticated" ON public.turmas FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para matrículas
CREATE POLICY "matriculas_select_authenticated" ON public.matriculas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "matriculas_insert_authenticated" ON public.matriculas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "matriculas_update_authenticated" ON public.matriculas FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "matriculas_delete_authenticated" ON public.matriculas FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para turma_disciplinas
CREATE POLICY "turma_disciplinas_select_authenticated" ON public.turma_disciplinas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "turma_disciplinas_insert_authenticated" ON public.turma_disciplinas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "turma_disciplinas_update_authenticated" ON public.turma_disciplinas FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "turma_disciplinas_delete_authenticated" ON public.turma_disciplinas FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para aulas
CREATE POLICY "aulas_select_authenticated" ON public.aulas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "aulas_insert_authenticated" ON public.aulas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "aulas_update_authenticated" ON public.aulas FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "aulas_delete_authenticated" ON public.aulas FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para presencas
CREATE POLICY "presencas_select_authenticated" ON public.presencas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "presencas_insert_authenticated" ON public.presencas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "presencas_update_authenticated" ON public.presencas FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "presencas_delete_authenticated" ON public.presencas FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para notas
CREATE POLICY "notas_select_authenticated" ON public.notas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "notas_insert_authenticated" ON public.notas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "notas_update_authenticated" ON public.notas FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "notas_delete_authenticated" ON public.notas FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para eventos
CREATE POLICY "eventos_select_authenticated" ON public.eventos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "eventos_insert_authenticated" ON public.eventos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "eventos_update_authenticated" ON public.eventos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "eventos_delete_authenticated" ON public.eventos FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para documentos
CREATE POLICY "documentos_select_authenticated" ON public.documentos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "documentos_insert_authenticated" ON public.documentos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "documentos_update_authenticated" ON public.documentos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "documentos_delete_authenticated" ON public.documentos FOR DELETE USING (auth.role() = 'authenticated');
