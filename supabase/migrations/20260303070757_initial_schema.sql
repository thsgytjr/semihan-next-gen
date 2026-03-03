-- ============================================
-- 세미한 차세대 교육국 (Semihan Next-Gen)
-- Initial Schema Migration
-- ============================================

-- ============================================
-- 1. Custom Types
-- ============================================
CREATE TYPE public.user_role AS ENUM ('admin', 'teacher');
CREATE TYPE public.event_type AS ENUM ('sunday_worship', 'special');

-- ============================================
-- 2. Departments (부서)
-- ============================================
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. Profiles (교사/관리자)
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role public.user_role NOT NULL DEFAULT 'teacher',
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. Students (학생)
-- ============================================
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  photo_url TEXT,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  birth_date DATE,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. Events (예배/이벤트)
-- ============================================
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  date DATE NOT NULL,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  type public.event_type NOT NULL DEFAULT 'sunday_worship',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Prevent duplicate events on same date for same department
CREATE UNIQUE INDEX idx_events_dept_date_type ON public.events (department_id, date, type);

-- ============================================
-- 6. Attendance (출석)
-- ============================================
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  checked_in BOOLEAN NOT NULL DEFAULT true,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  checked_in_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  UNIQUE (student_id, event_id)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. RLS Policies
-- ============================================

-- Departments: any authenticated user can read
CREATE POLICY "Authenticated users can view departments"
  ON public.departments FOR SELECT
  TO authenticated
  USING (true);

-- Departments: only admins can modify
CREATE POLICY "Admins can manage departments"
  ON public.departments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- Profiles: users can read all profiles (for display names)
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Profiles: users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- Profiles: allow insert for new user signup trigger
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

-- Students: authenticated users can view students in their department
CREATE POLICY "Users can view department students"
  ON public.students FOR SELECT
  TO authenticated
  USING (
    department_id IN (
      SELECT department_id FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- Students: authenticated users can manage students in their department
CREATE POLICY "Users can manage department students"
  ON public.students FOR INSERT
  TO authenticated
  WITH CHECK (
    department_id IN (
      SELECT department_id FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can update department students"
  ON public.students FOR UPDATE
  TO authenticated
  USING (
    department_id IN (
      SELECT department_id FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can delete department students"
  ON public.students FOR DELETE
  TO authenticated
  USING (
    department_id IN (
      SELECT department_id FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- Events: authenticated users can view events in their department
CREATE POLICY "Users can view department events"
  ON public.events FOR SELECT
  TO authenticated
  USING (
    department_id IN (
      SELECT department_id FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- Events: authenticated users can manage events in their department
CREATE POLICY "Users can manage department events"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (
    department_id IN (
      SELECT department_id FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can update department events"
  ON public.events FOR UPDATE
  TO authenticated
  USING (
    department_id IN (
      SELECT department_id FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- Attendance: authenticated users can view attendance for their department
CREATE POLICY "Users can view department attendance"
  ON public.attendance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = attendance.event_id
      AND (
        e.department_id IN (
          SELECT department_id FROM public.profiles
          WHERE profiles.id = (SELECT auth.uid())
        )
        OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = (SELECT auth.uid())
          AND profiles.role = 'admin'
        )
      )
    )
  );

-- Attendance: authenticated users can manage attendance
CREATE POLICY "Users can manage attendance"
  ON public.attendance FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = attendance.event_id
      AND (
        e.department_id IN (
          SELECT department_id FROM public.profiles
          WHERE profiles.id = (SELECT auth.uid())
        )
        OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = (SELECT auth.uid())
          AND profiles.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Users can update attendance"
  ON public.attendance FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = attendance.event_id
      AND (
        e.department_id IN (
          SELECT department_id FROM public.profiles
          WHERE profiles.id = (SELECT auth.uid())
        )
        OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = (SELECT auth.uid())
          AND profiles.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Users can delete attendance"
  ON public.attendance FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = attendance.event_id
      AND (
        e.department_id IN (
          SELECT department_id FROM public.profiles
          WHERE profiles.id = (SELECT auth.uid())
        )
        OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = (SELECT auth.uid())
          AND profiles.role = 'admin'
        )
      )
    )
  );

-- ============================================
-- 8. Storage Bucket for Student Photos
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-photos',
  'student-photos',
  true,
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Storage RLS: authenticated users can upload photos
CREATE POLICY "Authenticated users can upload student photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'student-photos');

-- Storage RLS: anyone can view photos (public bucket)
CREATE POLICY "Anyone can view student photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'student-photos');

-- Storage RLS: authenticated users can update their uploads
CREATE POLICY "Authenticated users can update student photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'student-photos');

-- Storage RLS: authenticated users can delete photos
CREATE POLICY "Authenticated users can delete student photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'student-photos');

-- ============================================
-- 9. Auto-create profile on signup (trigger)
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 10. Updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 11. Seed: Initial departments
-- ============================================
INSERT INTO public.departments (name, slug, description) VALUES
  ('영아부', 'sprout', 'Sprout - 영아부 (0-4세)');
