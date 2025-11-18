-- Popular disciplinas iniciais de forma idempotente

INSERT INTO public.disciplinas (nome, codigo, carga_horaria, descricao, ativo)
VALUES
  ('Matemática', 'MAT001', 80, 'Disciplina de Matemática básica', true),
  ('Português', 'POR001', 80, 'Disciplina de Língua Portuguesa', true),
  ('História', 'HIS001', 60, 'Disciplina de História', true),
  ('Geografia', 'GEO001', 60, 'Disciplina de Geografia', true),
  ('Ciências', 'CIE001', 60, 'Disciplina de Ciências', true),
  ('Educação Física', 'EDF001', 40, 'Disciplina de Educação Física', true),
  ('Artes', 'ART001', 40, 'Disciplina de Artes', true),
  ('Inglês', 'ING001', 40, 'Disciplina de Língua Inglesa', true)
ON CONFLICT (codigo) DO NOTHING;
