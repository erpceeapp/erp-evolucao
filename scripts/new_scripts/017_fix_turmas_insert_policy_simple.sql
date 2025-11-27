-- Script para permitir que diretor, secretaria e coordenacao possam inserir turmas
-- Solução SIMPLES e DIRETA sem funções complexas

-- 1. Remover políticas antigas que podem estar conflitando
DROP POLICY IF EXISTS turmas_insert_admin_coord ON turmas;
DROP POLICY IF EXISTS turmas_insert_policy ON turmas;
DROP POLICY IF EXISTS turmas_insert ON turmas;

-- 2. Criar política de INSERT simples e direta
-- Permite inserir turmas se o tipo_usuario for diretor, secretaria ou coordenacao
CREATE POLICY turmas_insert_allowed_users ON turmas
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.tipo_usuario IN ('diretor', 'secretaria', 'coordenacao')
  )
);

-- 3. Criar política de UPDATE para os mesmos usuários
DROP POLICY IF EXISTS turmas_update_admin_coord ON turmas;
DROP POLICY IF EXISTS turmas_update_policy ON turmas;
DROP POLICY IF EXISTS turmas_update ON turmas;

CREATE POLICY turmas_update_allowed_users ON turmas
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.tipo_usuario IN ('diretor', 'secretaria', 'coordenacao')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.tipo_usuario IN ('diretor', 'secretaria', 'coordenacao')
  )
);

-- 4. Criar política de DELETE para os mesmos usuários
DROP POLICY IF EXISTS turmas_delete_admin_coord ON turmas;
DROP POLICY IF EXISTS turmas_delete_policy ON turmas;
DROP POLICY IF EXISTS turmas_delete ON turmas;

CREATE POLICY turmas_delete_allowed_users ON turmas
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.tipo_usuario IN ('diretor', 'secretaria', 'coordenacao')
  )
);

-- Verificar as políticas criadas
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'turmas'
ORDER BY cmd;
