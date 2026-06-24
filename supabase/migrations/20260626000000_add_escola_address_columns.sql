ALTER TABLE public.escola
  ADD COLUMN IF NOT EXISTS logradouro text,
  ADD COLUMN IF NOT EXISTS numero text,
  ADD COLUMN IF NOT EXISTS complemento text,
  ADD COLUMN IF NOT EXISTS cidade text,
  ADD COLUMN IF NOT EXISTS estado text,
  ADD COLUMN IF NOT EXISTS cep text,
  ADD COLUMN IF NOT EXISTS telefone2 text,
  ADD COLUMN IF NOT EXISTS site text;

-- Políticas de INSERT e UPDATE que estavam faltando (só existiam SELECT)
CREATE POLICY escola_insert_allowed ON public.escola
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY escola_update_allowed ON public.escola
  FOR UPDATE TO authenticated USING (true);
