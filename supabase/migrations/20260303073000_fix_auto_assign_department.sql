-- ============================================
-- Fix: Auto-assign new users to sprout department
-- Root cause: handle_new_user trigger created profiles
-- with NULL department_id, causing RLS INSERT check to fail.
-- NULL IN (...) always evaluates to NULL (not true) in SQL.
-- ============================================

-- 1. Update trigger to auto-assign sprout department
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  sprout_dept_id UUID;
BEGIN
  -- Get the sprout department ID
  SELECT id INTO sprout_dept_id
  FROM public.departments
  WHERE slug = 'sprout'
  LIMIT 1;

  INSERT INTO public.profiles (id, email, display_name, department_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    sprout_dept_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix existing profiles that have NULL department_id
UPDATE public.profiles
SET department_id = (
  SELECT id FROM public.departments WHERE slug = 'sprout' LIMIT 1
)
WHERE department_id IS NULL;

-- 3. Also make first registered user an admin
--    (the user whose profile was created earliest)
UPDATE public.profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM public.profiles ORDER BY created_at ASC LIMIT 1
);
