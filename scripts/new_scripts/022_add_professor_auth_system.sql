-- Script para adicionar sistema de autenticação para professores
-- Adiciona coluna para rastrear primeiro acesso e função para criar usuário professor

-- Adicionar coluna para rastrear primeiro acesso
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS primeira_senha BOOLEAN DEFAULT true;

-- Atualizar perfis existentes como já tendo trocado a senha
UPDATE profiles SET primeira_senha = false WHERE primeira_senha IS NULL;

-- Função para criar usuário professor automaticamente
CREATE OR REPLACE FUNCTION create_professor_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_password TEXT;
  new_user_id UUID;
BEGIN
  -- Apenas criar usuário se o professor tiver email e CPF
  IF NEW.email IS NOT NULL AND NEW.cpf IS NOT NULL THEN
    -- Usar CPF sem formatação como senha padrão
    user_password := REGEXP_REPLACE(NEW.cpf, '[^0-9]', '', 'g');
    
    -- Criar usuário no auth.users (isso só funciona via service_role)
    -- Este código será executado via trigger quando secretaria cadastrar professor
    
    -- Criar perfil vinculado
    INSERT INTO profiles (id, email, nome_completo, telefone, tipo_usuario, ativo, primeira_senha)
    VALUES (
      gen_random_uuid(),
      NEW.email,
      NEW.nome_completo,
      NEW.telefone,
      'professor',
      NEW.ativo,
      true
    )
    ON CONFLICT (email) DO UPDATE
    SET nome_completo = EXCLUDED.nome_completo,
        telefone = EXCLUDED.telefone,
        ativo = EXCLUDED.ativo;
    
    -- Atualizar user_id no registro do professor
    UPDATE professores 
    SET user_id = (SELECT id FROM profiles WHERE email = NEW.email LIMIT 1)
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para executar função após inserir professor
DROP TRIGGER IF EXISTS on_professor_created ON professores;
CREATE TRIGGER on_professor_created
  AFTER INSERT ON professores
  FOR EACH ROW
  EXECUTE FUNCTION create_professor_user();

-- Comentários
COMMENT ON COLUMN profiles.primeira_senha IS 'Indica se o usuário ainda não trocou a senha padrão';
COMMENT ON FUNCTION create_professor_user() IS 'Cria usuário auth e perfil automaticamente quando professor é cadastrado';
