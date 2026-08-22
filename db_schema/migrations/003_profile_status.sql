-- ============================================================================
-- 003 — Employee active/inactive status
--
-- Idempotent and non-destructive. Adds one column, one index, and reissues
-- employee_directory with the new column appended at the end — Postgres
-- rejects CREATE OR REPLACE VIEW if it would reorder or remove an existing
-- column, so is_active is appended rather than inserted alongside the other
-- profile fields.
-- ============================================================================

BEGIN;

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles (is_active);

CREATE OR REPLACE VIEW public.employee_directory AS
SELECT
    p.id,
    p.login_id,
    p.role,
    p.first_name,
    p.last_name,
    (p.first_name || ' ' || p.last_name)          AS full_name,
    p.email,
    p.phone,
    p.avatar_url,
    p.date_of_joining,
    p.manager_id,
    m.first_name || ' ' || m.last_name            AS manager_name,
    p.department_id,
    d.name                                        AS department_name,
    p.designation_id,
    g.name                                        AS designation_name,
    g.level                                       AS designation_level,
    p.created_at,
    p.is_active
FROM public.profiles p
LEFT JOIN public.departments  d ON d.id = p.department_id
LEFT JOIN public.designations g ON g.id = p.designation_id
LEFT JOIN public.profiles     m ON m.id = p.manager_id;

COMMIT;
