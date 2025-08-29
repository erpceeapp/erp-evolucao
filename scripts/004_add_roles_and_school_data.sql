-- Adicionar sistema de roles e dados da escola

-- Criar enum para tipos de usuário
CREATE TYPE user_role AS ENUM ('admin', 'secretaria', 'professor', 'coordenacao');

-- Adicionar coluna role na tabela profiles
ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'professor';

-- Criar tabela para dados da escola
CREATE TABLE escola (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  endereco TEXT,
  cnpj VARCHAR(18),
  telefone VARCHAR(20),
  email VARCHAR(255),
  site VARCHAR(255),
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela para convites de usuários
CREATE TABLE user_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  invited_by UUID REFERENCES profiles(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_user_invites_email ON user_invites(email);
CREATE INDEX idx_user_invites_token ON user_invites(token);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Trigger para updated_at na tabela escola
CREATE OR REPLACE FUNCTION update_escola_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_escola_updated_at
  BEFORE UPDATE ON escola
  FOR EACH ROW
  EXECUTE FUNCTION update_escola_updated_at();
