-- =====================================================
-- CORREÇÃO DO TRIGGER DE CRIAÇÃO DE USUÁRIO
-- =====================================================
-- Este script corrige o trigger handle_new_user para lidar
-- corretamente com os dados enviados pelo formulário de cadastro

-- Remover trigger antigo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Criar função corrigida
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_count INTEGER;
    user_role TEXT;
    user_name TEXT;
    user_phone TEXT;
BEGIN
    -- Log para debug
    RAISE LOG 'Trigger handle_new_user iniciado para usuário: %', NEW.email;
    RAISE LOG 'Metadados recebidos: %', NEW.raw_user_meta_data;
    
    -- Contar usuários existentes
    SELECT COUNT(*) INTO user_count FROM public.profiles;
    RAISE LOG 'Número de usuários existentes: %', user_count;
    
    -- Extrair dados dos metadados
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'nome_completo', 
        NEW.raw_user_meta_data->>'full_name', 
        split_part(NEW.email, '@', 1)
    );
    user_phone := NEW.raw_user_meta_data->>'telefone';
    
    -- Obter tipo_usuario dos metadados
    user_role := NEW.raw_user_meta_data->>'tipo_usuario';
    
    -- Mapear tipo_usuario para role se necessário
    CASE user_role
        WHEN 'diretor' THEN user_role := 'admin';
        WHEN 'secretaria' THEN user_role := 'secretaria';
        WHEN 'professor' THEN user_role := 'professor';
        WHEN 'coordenacao' THEN user_role := 'coordenacao';
        WHEN 'admin' THEN user_role := 'admin';
        ELSE user_role := 'professor';
    END CASE;
    
    -- Primeiro usuário sempre é admin
    IF user_count = 0 THEN
        user_role := 'admin';
        RAISE LOG 'Primeiro usuário - definindo como admin';
    END IF;
    
    RAISE LOG 'Inserindo perfil com role: %', user_role;
    
    -- Inserir perfil
    INSERT INTO public.profiles (
        id,
        nome_completo,
        email,
        telefone,
        role,
        ativo
    ) VALUES (
        NEW.id,
        user_name,
        NEW.email,
        user_phone,
        user_role,
        true
    );
    
    RAISE LOG 'Perfil inserido com sucesso para usuário: %', NEW.email;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'ERRO no trigger handle_new_user: % - %', SQLERRM, SQLSTATE;
        RAISE EXCEPTION 'Erro ao criar perfil: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Garantir que a política de INSERT permite a criação de perfis
DROP POLICY IF EXISTS "Sistema pode inserir perfis" ON public.profiles;
CREATE POLICY "Sistema pode inserir perfis" ON public.profiles 
    FOR INSERT 
    WITH CHECK (true);

-- Comentário final
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function que cria automaticamente um perfil quando um novo usuário é registrado. Inclui logs detalhados para debug.';
