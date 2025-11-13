-- Adicionar coluna tipo_usuario se não existir e popular com base no role

DO $$ 
BEGIN
  -- Adicionar coluna tipo_usuario se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'tipo_usuario'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN tipo_usuario TEXT;
  END IF;
END $$;

-- Sincronizar tipo_usuario com role para registros existentes
UPDATE public.profiles 
SET tipo_usuario = CASE 
  WHEN role = 'admin' THEN 'diretor'
  WHEN role = 'secretaria' THEN 'secretaria'
  WHEN role = 'professor' THEN 'professor'
  WHEN role = 'coordenacao' THEN 'coordenacao'
  ELSE 'professor'
END
WHERE tipo_usuario IS NULL;
