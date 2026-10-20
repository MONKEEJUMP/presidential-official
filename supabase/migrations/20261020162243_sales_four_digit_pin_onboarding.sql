-- PW7404-1041: private per-account PIN encoding and mandatory first-login change.
BEGIN;
ALTER TABLE public.sales_rep_profiles
  ADD COLUMN IF NOT EXISTS must_change_pin boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pin_key text CHECK (pin_key IS NULL OR pin_key ~ '^[a-f0-9]{64}$');

COMMENT ON COLUMN public.sales_rep_profiles.must_change_pin IS
  'Server-enforced CRM gate. Only PIN change and sign-out are available until cleared.';
COMMENT ON COLUMN public.sales_rep_profiles.pin_key IS
  'Private random per-account HMAC key. Never select into public responses or store plaintext PINs.';

-- The existing profile table and CRM data/RPCs already deny anon/authenticated access.
REVOKE ALL ON public.sales_rep_profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_rep_profiles TO service_role;
COMMIT;
