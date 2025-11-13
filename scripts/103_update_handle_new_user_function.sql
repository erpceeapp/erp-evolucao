-- Atualizar função handle_new_user para ser compatível com estrutura atual

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_count INTEGER;
    user_role TEXT;
    user_tipo TEXT;
    user_name TEXT;
    user_phone TEXT;
BEGIN
    -- Contar usuários existentes
    SELECT COUNT(*) INTO user_count FROM public.profiles;
    
    -- Extrair dados dos metadados
    user_name := COALESCE(
      NEW.raw_user_meta_data->>'nome_completo', 
      NEW.raw_user_meta_data->>'full_name', 
      split_part(NEW.email, '@', 1)
    );
    user_phone := NEW.raw_user_meta_data->>'telefone';
    user_tipo := NEW.raw_user_meta_data->>'tipo_usuario';
    
    -- Mapear tipo_usuario para role
    CASE user_tipo
        WHEN 'diretor' THEN user_role := 'admin';
        WHEN 'secretaria' THEN user_role := 'secretaria';
        WHEN 'professor' THEN user_role := 'professor';
        WHEN 'coordenacao' THEN user_role := 'coordenacao';
        ELSE user_role := 'professor';
    END CASE;
    
    -- Primeiro usuário sempre é admin
    IF user_count = 0 THEN
        user_role := 'admin';
        user_tipo := 'diretor';
    END IF;
    
    -- Inserir ou atualizar perfil
    INSERT INTO public.profiles (
        id,
        nome_completo,
        email,
        telefone,
        role,
        tipo_usuario,
        ativo
    ) VALUES (
        NEW.id,
        user_name,
        NEW.email,
        user_phone,
        user_role,
        COALESCE(user_tipo, 'professor'),
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        nome_completo = EXCLUDED.nome_completo,
        email = EXCLUDED.email,
        telefone = EXCLUDED.telefone,
        role = EXCLUDED.role,
        tipo_usuario = EXCLUDED.tipo_usuario,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
