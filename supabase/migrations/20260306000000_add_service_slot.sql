-- Add service_slot column to students table
-- Values: null (unset), '1부', '2부'
ALTER TABLE students ADD COLUMN IF NOT EXISTS service_slot TEXT;
