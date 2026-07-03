ALTER TABLE public.eventos DROP CONSTRAINT IF EXISTS eventos_tipo_evento_check;

ALTER TABLE public.eventos ADD CONSTRAINT eventos_tipo_evento_check
  CHECK (tipo_evento = ANY (ARRAY['aula'::text, 'prova'::text, 'reuniao'::text, 'evento'::text, 'feriado'::text, 'ferias'::text, 'outros'::text, 'aviso_pais'::text]));
