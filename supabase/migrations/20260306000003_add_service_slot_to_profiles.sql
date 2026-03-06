-- Add service_slot to profiles so teachers can be assigned to 1부/2부
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS service_slot TEXT;
