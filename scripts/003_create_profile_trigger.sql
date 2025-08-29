-- Trigger para criar perfil automaticamente quando um usuário se cadastra

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome_completo, email, tipo_usuario)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nome_completo', 'Usuário'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'tipo_usuario', 'secretaria')
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
