-- Adds the columns the application writes but the live schema lacks.
-- All are additive and nullable, so running this is non-destructive.
--
-- Until it is applied the app still works: src/lib/supabase/write.ts detects
-- PostgREST's "unknown column" error, drops the offending field and retries,
-- so the row is saved without that one value rather than failing outright.
--
-- What each column restores:
--   time_off.reason          -- why the employee requested leave (shown in approvals)
--   attendance.notes         -- optional note attached to a shift punch
--   profiles.pan_number      -- statutory ID captured on the profile screen
--   profiles.uan_number      -- provident fund UAN
--   profiles.marital_status  -- personal detail on the profile screen
--   profiles.updated_at      -- last-modified timestamp

ALTER TABLE public.time_off   ADD COLUMN IF NOT EXISTS reason         TEXT;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS notes          TEXT;
ALTER TABLE public.profiles   ADD COLUMN IF NOT EXISTS pan_number     VARCHAR(20);
ALTER TABLE public.profiles   ADD COLUMN IF NOT EXISTS uan_number     VARCHAR(30);
ALTER TABLE public.profiles   ADD COLUMN IF NOT EXISTS marital_status VARCHAR(20);
ALTER TABLE public.profiles   ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMPTZ DEFAULT NOW();
