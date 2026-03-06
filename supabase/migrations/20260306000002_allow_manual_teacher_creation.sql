-- Allow profiles to be created without a corresponding auth.users account.
-- This enables manually adding teachers without requiring an email invite.

-- 1. Drop FK constraint linking profiles.id to auth.users.id
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Give profiles.id a default so it auto-generates for new rows
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. Make email nullable (manually-added teachers don't need an email)
ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;

-- 4. Add RLS INSERT policy so admins can directly insert teacher profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'profiles'
      AND policyname = 'Admins can insert profiles'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Admins can insert profiles"
        ON public.profiles FOR INSERT
        TO authenticated
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (SELECT auth.uid())
              AND p.role = 'admin'
          )
        )
    $policy$;
  END IF;
END $$;
