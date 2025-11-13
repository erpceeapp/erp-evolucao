-- Criar função utilitária para atualizar updated_at
-- Esta função é usada por triggers em várias tabelas

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comentário para documentação
COMMENT ON FUNCTION public.update_updated_at_column() IS 
  'Função trigger que atualiza automaticamente a coluna updated_at com o timestamp atual';
