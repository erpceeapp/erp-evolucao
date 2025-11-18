-- Criar tabela escola que está faltando
-- Este script cria a tabela escola se ela não existir

CREATE TABLE IF NOT EXISTS public.escola (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cnpj TEXT,
  endereco TEXT,
  telefone TEXT,
  email TEXT,
  diretor_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_escola_cnpj') THEN
    CREATE INDEX idx_escola_cnpj ON public.escola(cnpj);
  END IF;
END $$;

-- Habilitar RLS
ALTER TABLE public.escola ENABLE ROW LEVEL SECURITY;

-- Criar trigger para updated_at
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_escola_updated_at'
  ) THEN
    CREATE TRIGGER update_escola_updated_at 
      BEFORE UPDATE ON public.escola 
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Criar políticas RLS de forma idempotente
DO $$ 
BEGIN
  -- Política de visualização para todos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'escola' 
    AND policyname = 'escola_select_all'
  ) THEN
    CREATE POLICY "escola_select_all" ON public.escola 
      FOR SELECT USING (true);
  END IF;

  -- Política de gerenciamento para admin
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'escola' 
    AND policyname = 'escola_manage_admin'
  ) THEN
    CREATE POLICY "escola_manage_admin" ON public.escola 
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;

-- Inserir dados iniciais se a tabela estiver vazia
INSERT INTO public.escola (nome, endereco)
SELECT 
  'Minha Escola',
  'Endereço da escola'
WHERE NOT EXISTS (SELECT 1 FROM public.escola);
