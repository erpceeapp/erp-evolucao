-- Corrige handle_new_user para ignorar tipo_usuario enviado pelo cliente
-- Antes: COALESCE(raw_user_meta_data->>'tipo_usuario', 'professor') — permitia auto-escalada
-- Agora: sempre 'professor' — admin define o role depois
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, nome_completo, telefone, tipo_usuario, ativo)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'nome_completo', new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'telefone', new.raw_user_meta_data->>'phone', ''),
    'professor',
    true
  );
  RETURN new;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Erro ao criar perfil: %', SQLERRM;
    RETURN new;
END;
$function$;
