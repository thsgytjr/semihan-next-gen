-- Add teacher assignment, parent info, graduation date, prayer request to students
ALTER TABLE public.students
  ADD COLUMN teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN parent_name TEXT,
  ADD COLUMN parent_phone TEXT,
  ADD COLUMN graduation_date DATE,
  ADD COLUMN prayer_request TEXT;
