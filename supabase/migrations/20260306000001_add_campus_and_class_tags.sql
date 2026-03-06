-- Add campus field to profiles (teacher/admin campus assignment)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS campus TEXT;

-- Add campus field to students
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS campus TEXT;

-- Create class_tags table for per-tag color coding
CREATE TABLE IF NOT EXISTS public.class_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#22c55e',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(department_id, name)
);

ALTER TABLE public.class_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "class_tags_select"
  ON public.class_tags FOR SELECT TO authenticated USING (true);

CREATE POLICY "class_tags_insert"
  ON public.class_tags FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "class_tags_update"
  ON public.class_tags FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "class_tags_delete"
  ON public.class_tags FOR DELETE TO authenticated USING (true);

-- Allow admins to update any profile (for teacher management UI)
-- Use DO block to avoid error if policy already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'profiles'
      AND policyname = 'Admins can update any profile'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Admins can update any profile"
        ON public.profiles FOR UPDATE
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (SELECT auth.uid())
            AND p.role = 'admin'
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (SELECT auth.uid())
            AND p.role = 'admin'
          )
        )
    $policy$;
  END IF;
END
$$;
