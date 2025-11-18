-- Criar tabela de convites de usuários de forma idempotente

CREATE TABLE IF NOT EXISTS public.user_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'secretaria', 'professor', 'coordenacao')),
  invited_by UUID REFERENCES public.profiles(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices se não existirem
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_invites_email') THEN
    CREATE INDEX idx_user_invites_email ON public.user_invites(email);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_invites_token') THEN
    CREATE INDEX idx_user_invites_token ON public.user_invites(token);
  END IF;
END $$;

-- Habilitar RLS
ALTER TABLE public.user_invites ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS de forma idempotente
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_invites' 
    AND policyname = 'user_invites_manage_admin'
  ) THEN
    CREATE POLICY "user_invites_manage_admin" ON public.user_invites 
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;
