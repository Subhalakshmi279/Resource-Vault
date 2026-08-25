-- 1. Create Data Backup Safety Net for all altered tables
CREATE TABLE IF NOT EXISTS public.resources_backup AS SELECT * FROM public.resources;
CREATE TABLE IF NOT EXISTS public.subtopic_pins_backup AS SELECT * FROM public.subtopic_pins;
ALTER TABLE public.resources_backup ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtopic_pins_backup ENABLE ROW LEVEL SECURITY;

-- 2. Create Subtopics Table (area as TEXT NOT NULL to support all existing resources safely)
CREATE TABLE IF NOT EXISTS public.subtopics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Case and whitespace-insensitive unique index per area
CREATE UNIQUE INDEX IF NOT EXISTS subtopics_area_lower_trim_name_idx ON public.subtopics (area, LOWER(TRIM(name)));

-- Enable RLS & Grants on subtopics
ALTER TABLE public.subtopics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.subtopics;
DROP POLICY IF EXISTS "Allow public write access" ON public.subtopics;
CREATE POLICY "Allow public read access" ON public.subtopics FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public write access" ON public.subtopics FOR ALL TO anon, authenticated USING (true);
GRANT ALL ON TABLE public.subtopics TO anon, authenticated;

-- 3. Extract unique (area, subtopic) pairs into subtopics table with trimmed names
INSERT INTO public.subtopics (area, name)
SELECT DISTINCT area, TRIM(subtopic)
FROM public.resources
WHERE subtopic IS NOT NULL AND TRIM(subtopic) != ''
ON CONFLICT (area, LOWER(TRIM(name))) DO NOTHING;

-- 4. Add subtopic_id FK column to resources table (RESTRICT to prevent silent DB cascades)
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS subtopic_id UUID REFERENCES public.subtopics(id) ON DELETE RESTRICT;

-- Backfill resources.subtopic_id from subtopics table
UPDATE public.resources r
SET subtopic_id = s.id
FROM public.subtopics s
WHERE r.area = s.area AND LOWER(TRIM(r.subtopic)) = LOWER(TRIM(s.name));

-- 5. Migrate subtopic_pins table: replace text subtopic column with subtopic_id UUID FK
ALTER TABLE public.subtopic_pins ADD COLUMN IF NOT EXISTS subtopic_id UUID REFERENCES public.subtopics(id) ON DELETE CASCADE;

UPDATE public.subtopic_pins sp
SET subtopic_id = s.id
FROM public.resources r
JOIN public.subtopics s ON r.area = s.area AND LOWER(TRIM(r.subtopic)) = LOWER(TRIM(s.name))
WHERE sp.resource_id = r.id;
