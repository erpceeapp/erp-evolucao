-- Melhoria de RLS Policies - Restrição por tipo_usuario

-- Habilitar RLS em tabelas críticas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas ENABLE ROW LEVEL SECURITY;

-- Policy para leitura de profiles (cada um vê o seu ou admin vê tudo)
DROP POLICY IF EXISTS "Users view own profile" ON profiles;
CREATE POLICY "Users view own profile" ON profiles
FOR SELECT
TO authenticated
USING (id = auth.uid() OR EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND tipo_usuario = 'admin'
));

-- Policy simples para notas - admin vê tudo
DROP POLICY IF EXISTS "Read notas based on role" ON notas;
CREATE POLICY "Read notas based on role" ON notas
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.tipo_usuario = 'admin'
  )
);
