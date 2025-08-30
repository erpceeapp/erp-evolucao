-- Atualizando trigger para usar campo 'role' em vez de 'tipo_usuario'
-- Trigger para criar perfil automaticamente quando um usuário se cadastra

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Contar quantos usuários já existem
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  INSERT INTO public.profiles (id, nome_completo, email, telefone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nome_completo', 'Usuário'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'telefone', ''),
    -- Se for o primeiro usuário, torna admin, senão usa o tipo do cadastro
    CASE 
      WHEN user_count = 0 THEN 'admin'
      ELSE COALESCE(NEW.raw_user_meta_data ->> 'tipo_usuario', 'professor')
    END
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Remove trigger existente se houver
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Cria o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
