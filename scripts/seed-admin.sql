-- ============================================================
-- Seed: Usuario Administrador Master
-- Email:    admin@cee.com
-- Senha:    cee@123
-- Tipo:     admin (todas as permissoes)
-- ============================================================
-- Instrucoes:
--   1. Acesse o SQL Editor do Supabase (Dashboard > SQL Editor)
--   2. Cole e execute todo o script abaixo
--   3. Faca login em /auth/login com admin@cee.com / cee@123
-- ============================================================
-- Observacao: O Supabase tem uma trigger que cria o profile
-- automaticamente ao inserir em auth.users (le raw_user_meta_data).
-- Por isso usamos UPDATE em profiles em vez de INSERT.
-- ============================================================

-- (1) Garantir que 'admin' seja aceito no check constraint da tabela profiles
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_tipo_usuario_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_tipo_usuario_check
CHECK (tipo_usuario = ANY (ARRAY[
  'admin'::text,
  'secretaria'::text,
  'professor'::text,
  'coordenacao'::text,
  'diretor'::text
]));

-- (2) Inserir usuario em auth.users (se email ja existir, apenas retorna o ID)
--     Hash bcrypt para "cee@123": $2b$10$trjJTc.vu8Vt4HXE28Mj..YAF9Opt80jA9Yuq4RDa.REETWMdIM36
--     Se o login falhar, troque $2b$ por $2a$ no hash abaixo.
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verifica se o usuario ja existe
  SELECT id INTO v_user_id FROM "auth"."users" WHERE email = 'admin@cee.com';

  IF v_user_id IS NULL THEN
    -- Cria o usuario
    INSERT INTO "auth"."users" (
      "instance_id", "id", "aud", "role", "email", "encrypted_password",
      "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at",
      "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change",
      "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data",
      "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at",
      "phone_change", "phone_change_token", "phone_change_sent_at",
      "email_change_token_current", "email_change_confirm_status", "banned_until",
      "reauthentication_token", "reauthentication_sent_at", "is_sso_user",
      "deleted_at", "is_anonymous"
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@cee.com',
      '$2a$10$trjJTc.vu8Vt4HXE28Mj..YAF9Opt80jA9Yuq4RDa.REETWMdIM36',
      NOW(), NULL, '', NULL, '', NULL, '', '', NULL, NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"sub": "", "email": "admin@cee.com", "tipo_usuario": "admin", "nome_completo": "Administrador Master", "email_verified": true, "phone_verified": false}',
      NULL, NOW(), NOW(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false
    )
    RETURNING id INTO v_user_id;

    -- Insere identity (necessario para login email/senha)
    INSERT INTO "auth"."identities" (
      "provider_id", "user_id", "identity_data", "provider",
      "last_sign_in_at", "created_at", "updated_at", "id"
    ) VALUES (
      v_user_id::text,
      v_user_id,
      jsonb_build_object(
        'sub', v_user_id::text,
        'email', 'admin@cee.com',
        'tipo_usuario', 'admin',
        'nome_completo', 'Administrador Master',
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      NOW(), NOW(), NOW(),
      gen_random_uuid()
    );

    -- Atualiza o profile criado pela trigger
    UPDATE "public"."profiles" SET
      "nome_completo" = 'Administrador Master',
      "email" = 'admin@cee.com',
      "tipo_usuario" = 'admin',
      "ativo" = true,
      "updated_at" = NOW(),
      "primeira_senha" = false
    WHERE id = v_user_id;

    RAISE NOTICE 'Usuario admin@cee.com criado com sucesso (ID: %)', v_user_id;
  ELSE
    -- Atualiza os dados caso o usuario ja exista
    UPDATE "public"."profiles" SET
      "nome_completo" = 'Administrador Master',
      "email" = 'admin@cee.com',
      "tipo_usuario" = 'admin',
      "ativo" = true,
      "updated_at" = NOW(),
      "primeira_senha" = false
    WHERE id = v_user_id;

    RAISE NOTICE 'Usuario admin@cee.com ja existia (ID: %). Dados atualizados.', v_user_id;
  END IF;
END $$;

-- (3) Mostrar resultado
SELECT
  u.id,
  u.email,
  u.raw_user_meta_data->>'tipo_usuario' AS tipo,
  p.tipo_usuario AS profile_tipo,
  p.primeira_senha
FROM "auth"."users" u
LEFT JOIN "public"."profiles" p ON p.id = u.id
WHERE u.email = 'admin@cee.com';
