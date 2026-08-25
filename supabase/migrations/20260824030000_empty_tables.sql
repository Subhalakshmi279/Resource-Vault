-- 1. Empty all live tables in Supabase Postgres
TRUNCATE TABLE public.subtopic_pins RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.home_pins RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.resources RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.subtopics RESTART IDENTITY CASCADE;

-- 2. Remove temporary migration backup tables
DROP TABLE IF EXISTS public.resources_backup CASCADE;
DROP TABLE IF EXISTS public.subtopic_pins_backup CASCADE;
