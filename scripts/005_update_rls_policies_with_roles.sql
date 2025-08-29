-- Atualizar políticas RLS com sistema de roles

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Políticas para profiles com roles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admin can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para escola
CREATE POLICY "Admin can manage escola" ON escola
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "All users can view escola" ON escola
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Políticas para user_invites
CREATE POLICY "Admin can manage invites" ON user_invites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Atualizar políticas de turmas para secretaria
DROP POLICY IF EXISTS "Users can view turmas" ON turmas;
DROP POLICY IF EXISTS "Users can insert turmas" ON turmas;
DROP POLICY IF EXISTS "Users can update turmas" ON turmas;
DROP POLICY IF EXISTS "Users can delete turmas" ON turmas;

CREATE POLICY "Users can view turmas" ON turmas
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'secretaria', 'coordenacao')
      ) OR
      professor_responsavel_id = auth.uid()
    )
  );

CREATE POLICY "Admin and secretaria can manage turmas" ON turmas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'secretaria')
    )
  );

-- Habilitar RLS nas novas tabelas
ALTER TABLE escola ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invites ENABLE ROW LEVEL SECURITY;
