-- Drop legacy subtopic text columns after verifying subtopic_id backfill
ALTER TABLE public.resources DROP COLUMN IF EXISTS subtopic;
ALTER TABLE public.subtopic_pins DROP COLUMN IF EXISTS subtopic;
