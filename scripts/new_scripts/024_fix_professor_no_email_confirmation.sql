-- Script para ajustar professores existentes e remover necessidade de confirmação

-- Confirmar email de todos os professores já cadastrados no auth.users
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email IN (
  SELECT email FROM professores WHERE email IS NOT NULL
);

-- Atualizar profiles para marcar primeira_senha = true para professores
-- que ainda não trocaram a senha
UPDATE profiles
SET primeira_senha = true
WHERE id IN (
  SELECT p.user_id 
  FROM professores p 
  WHERE p.user_id IS NOT NULL
)
AND primeira_senha IS NULL;

-- Comentário: Professores agora podem fazer login imediatamente após o cadastro
-- sem necessidade de confirmar email. A senha padrão é o CPF.
