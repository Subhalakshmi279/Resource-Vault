-- Create resources table
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  local_id TEXT UNIQUE,
  title TEXT NOT NULL,
  url TEXT,
  description TEXT,
  type TEXT NOT NULL,
  area TEXT NOT NULL,
  subtopic TEXT NOT NULL,
  file_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on resources
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.resources;
DROP POLICY IF EXISTS "Allow public write access" ON public.resources;
CREATE POLICY "Allow public read access" ON public.resources FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public write access" ON public.resources FOR ALL TO anon, authenticated USING (true);

-- Create home_pins table
CREATE TABLE IF NOT EXISTS public.home_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on home_pins
ALTER TABLE public.home_pins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.home_pins;
DROP POLICY IF EXISTS "Allow public write access" ON public.home_pins;
CREATE POLICY "Allow public read access" ON public.home_pins FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public write access" ON public.home_pins FOR ALL TO anon, authenticated USING (true);

-- Create subtopic_pins table
CREATE TABLE IF NOT EXISTS public.subtopic_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  subtopic TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(resource_id, subtopic)
);

-- Enable RLS on subtopic_pins
ALTER TABLE public.subtopic_pins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.subtopic_pins;
DROP POLICY IF EXISTS "Allow public write access" ON public.subtopic_pins;
CREATE POLICY "Allow public read access" ON public.subtopic_pins FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public write access" ON public.subtopic_pins FOR ALL TO anon, authenticated USING (true);

-- Grant API Role Privileges (Fixes: permission denied for table resources)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.resources TO anon, authenticated;
GRANT ALL ON TABLE public.home_pins TO anon, authenticated;
GRANT ALL ON TABLE public.subtopic_pins TO anon, authenticated;

-- Create storage bucket 'vault-files' if it does not exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vault-files', 'vault-files', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS Policies for 'vault-files'
DROP POLICY IF EXISTS "Vault storage select policy" ON storage.objects;
DROP POLICY IF EXISTS "Vault storage insert policy" ON storage.objects;
DROP POLICY IF EXISTS "Vault storage update policy" ON storage.objects;
DROP POLICY IF EXISTS "Vault storage delete policy" ON storage.objects;
DROP POLICY IF EXISTS "Allow public storage upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow public storage select" ON storage.objects;
DROP POLICY IF EXISTS "Allow public storage update" ON storage.objects;
DROP POLICY IF EXISTS "Allow public storage delete" ON storage.objects;

CREATE POLICY "Allow public storage select" ON storage.objects FOR SELECT TO public USING (bucket_id = 'vault-files');
CREATE POLICY "Allow public storage upload" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'vault-files');
CREATE POLICY "Allow public storage update" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'vault-files') WITH CHECK (bucket_id = 'vault-files');
CREATE POLICY "Allow public storage delete" ON storage.objects FOR DELETE TO public USING (bucket_id = 'vault-files');
