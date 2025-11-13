-- Tabela para armazenar links de documentos importantes
CREATE TABLE IF NOT EXISTS links_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  url TEXT NOT NULL,
  descricao TEXT,
  icone TEXT DEFAULT 'file-text', -- nome do ícone lucide
  cor TEXT DEFAULT 'blue', -- cor do botão (blue, green, purple, orange, red, etc)
  ordem INTEGER DEFAULT 0, -- ordem de exibição
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE TRIGGER update_links_documentos_updated_at
  BEFORE UPDATE ON links_documentos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Políticas RLS
ALTER TABLE links_documentos ENABLE ROW LEVEL SECURITY;

-- Todos usuários autenticados podem visualizar links ativos
CREATE POLICY IF NOT EXISTS "links_documentos_select_authenticated"
  ON links_documentos FOR SELECT
  TO authenticated
  USING (ativo = true);

-- Apenas admin e coordenação podem gerenciar links
CREATE POLICY IF NOT EXISTS "links_documentos_manage_admin_coord"
  ON links_documentos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'coordenacao')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'coordenacao')
    )
  );

-- Criar alguns links de exemplo
INSERT INTO links_documentos (titulo, url, descricao, icone, cor, ordem)
VALUES 
  ('Documentação do Sistema', 'https://docs.example.com', 'Acesse a documentação completa do sistema', 'book-open', 'blue', 1),
  ('Base Nacional Comum Curricular', 'http://basenacionalcomum.mec.gov.br/', 'Consulte a BNCC', 'graduation-cap', 'green', 2),
  ('Portal do MEC', 'http://portal.mec.gov.br/', 'Acesse o Portal do Ministério da Educação', 'school', 'purple', 3)
ON CONFLICT DO NOTHING;
