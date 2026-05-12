DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_uid,
    'authenticated',
    'authenticated',
    'marcelogois@gmail.com',
    crypt('Vingacasa1234', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('first_name','Marcelo','last_name','Gois','country','Brasil','whatsapp','+5511965444151'),
    now(), now(), '', '', '', ''
  );

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), v_uid,
    jsonb_build_object('sub', v_uid::text, 'email','marcelogois@gmail.com', 'email_verified', true),
    'email', v_uid::text, now(), now(), now());

  INSERT INTO public.profiles (id, whatsapp) VALUES (v_uid, '+5511965444151')
  ON CONFLICT (id) DO UPDATE SET whatsapp = EXCLUDED.whatsapp;
END $$;