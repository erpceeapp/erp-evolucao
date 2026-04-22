-- Corrigir recursão infinita na policy de profiles
-- O problema é que a policy de profiles referencia a própria tabela profiles

-- Remover policy problemática
DROP POLICY IF EXISTS "Users view own profile" ON profiles;

-- Criar policy simples sem recursão
-- Cada usuário pode ver apenas seu próprio perfil
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Policy para admins verem todos os perfis (usando auth.jwt() ao invés de subconsulta)
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'tipo_usuario') = 'admin'
  OR
  (auth.jwt() -> 'app_metadata' ->> 'tipo_usuario') = 'admin'
);

-- Garantir que usuarios podem atualizar seu próprio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Remover policy problemática de notas também se existir
DROP POLICY IF EXISTS "Read notas based on role" ON notas;

-- Criar policy simples para notas - todos autenticados podem ler
CREATE POLICY "Authenticated users can read notas" ON notas
FOR SELECT
TO authenticated
USING (true);

-- Todos autenticados podem inserir/atualizar notas (a validação de permissão é feita no app)
CREATE POLICY "Authenticated users can insert notas" ON notas
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update notas" ON notas
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
