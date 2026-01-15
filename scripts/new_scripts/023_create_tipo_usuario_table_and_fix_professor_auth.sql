CREATE TABLE IF NOT EXISTS tipo_usuario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text UNIQUE NOT NULL,
  descricao text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inserir tipos de usuário padrão
INSERT INTO tipo_usuario (nome, descricao) VALUES
  ('secretaria', 'Equipe de secretaria escolar'),
  ('professor', 'Professor(a)'),
  ('coordenacao', 'Coordenação pedagógica'),
  ('diretor', 'Direção escolar')
ON CONFLICT (nome) DO NOTHING;

-- Adicionar coluna tipo_usuario_id na tabela profiles (temporária)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tipo_usuario_id uuid REFERENCES tipo_usuario(id);

-- Migrar dados existentes de tipo_usuario (text) para tipo_usuario_id (FK)
UPDATE profiles
SET tipo_usuario_id = (
  SELECT id FROM tipo_usuario WHERE nome = profiles.tipo_usuario
)
WHERE tipo_usuario IS NOT NULL;

-- Garantir que primeira_senha seja false por padrão para não-professores
UPDATE profiles
SET primeira_senha = false
WHERE tipo_usuario != 'professor' AND primeira_senha IS NULL;

-- Para professores existentes, marcar primeira_senha = true
UPDATE profiles
SET primeira_senha = true
WHERE tipo_usuario = 'professor';

-- Criar usuários no auth.users para professores já cadastrados que ainda não têm
DO $$
DECLARE
  prof RECORD;
  senha_cpf text;
BEGIN
  FOR prof IN 
    SELECT p.id, p.cpf, p.email, p.nome_completo
    FROM professores p
    WHERE p.email IS NOT NULL 
      AND p.cpf IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM profiles pr WHERE pr.email = p.email
      )
  LOOP
    -- Remove formatação do CPF (apenas números)
    senha_cpf := regexp_replace(prof.cpf, '[^0-9]', '', 'g');
    
    -- Criar usuário no auth.users com senha = CPF
    -- Nota: Esta operação requer permissões especiais e pode precisar ser executada manualmente
    -- através do Supabase Dashboard ou usando a service role key
    INSERT INTO auth.users (
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data
    ) VALUES (
      prof.email,
      crypt(senha_cpf, gen_salt('bf')),
      now(),
      jsonb_build_object(
        'nome_completo', prof.nome_completo,
        'tipo_usuario', 'professor'
      )
    ) ON CONFLICT (email) DO NOTHING;
    
  END LOOP;
END $$;

-- Remover a coluna antiga tipo_usuario (text) depois da migração
-- Comentado por segurança - execute manualmente após validar a migração
-- ALTER TABLE profiles DROP COLUMN IF EXISTS tipo_usuario;

-- Renomear a nova coluna para tipo_usuario_id (manter o nome por enquanto para compatibilidade)
-- ALTER TABLE profiles RENAME COLUMN tipo_usuario_id TO tipo_usuario_id;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_profiles_tipo_usuario_id ON profiles(tipo_usuario_id);

-- Políticas RLS para tipo_usuario
ALTER TABLE tipo_usuario ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tipo_usuario_select_all" ON tipo_usuario;
CREATE POLICY "tipo_usuario_select_all"
ON tipo_usuario FOR SELECT
TO authenticated
USING (true);

COMMENT ON TABLE tipo_usuario IS 'Tabela de tipos de usuário do sistema';
COMMENT ON COLUMN profiles.tipo_usuario_id IS 'Tipo de usuário (FK para tipo_usuario)';
