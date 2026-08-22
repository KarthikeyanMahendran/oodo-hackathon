-- ============================================================================
-- 002 — Organisation structure + normalised leave
--
-- Run this whole file once in the Supabase SQL editor. It is idempotent and
-- non-destructive: every statement guards with IF NOT EXISTS / ON CONFLICT,
-- and existing free-text values are backfilled into the new tables before the
-- foreign keys are populated, so no data is lost.
--
-- What it does
--   1. departments            — one row per department
--   2. designations           — scoped to a department (atomic mapping)
--   3. profiles.department_id / designation_id  — FK columns beside the old text
--   4. leave_types            — configurable leave policy
--   5. leave_balances         — per employee, per type, per year
--   6. leave_requests         — replaces the flat time_off table
--   7. Backfill + seed + indexes + RLS
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Departments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.departments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(120) NOT NULL,
    code        VARCHAR(20),
    description TEXT,
    head_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT departments_name_key UNIQUE (name)
);

-- ---------------------------------------------------------------------------
-- 2. Designations — always scoped to exactly one department
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.designations (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    name          VARCHAR(120) NOT NULL,
    code          VARCHAR(20),
    level         SMALLINT NOT NULL DEFAULT 1,
    description   TEXT,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- The same title may exist in two departments, but never twice in one.
    CONSTRAINT designations_dept_name_key UNIQUE (department_id, name),
    CONSTRAINT designations_level_check CHECK (level BETWEEN 1 AND 10)
);

-- ---------------------------------------------------------------------------
-- 3. Wire profiles to the new tables (text columns are kept for rollback)
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS department_id  UUID REFERENCES public.departments(id)  ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS designation_id UUID REFERENCES public.designations(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- 4. Leave types — policy lives in data, not in code
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leave_types (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                  VARCHAR(80) NOT NULL,
    code                  VARCHAR(20) NOT NULL,
    days_allowed_per_year NUMERIC(5,1) NOT NULL DEFAULT 0,
    is_paid               BOOLEAN NOT NULL DEFAULT TRUE,
    requires_document     BOOLEAN NOT NULL DEFAULT FALSE,
    min_notice_days       SMALLINT NOT NULL DEFAULT 0,
    max_consecutive_days  SMALLINT NOT NULL DEFAULT 0,   -- 0 = unlimited
    can_carry_forward     BOOLEAN NOT NULL DEFAULT FALSE,
    max_carry_forward     NUMERIC(4,1) NOT NULL DEFAULT 0,
    color_hex             CHAR(7) NOT NULL DEFAULT '#6b7280',
    is_active             BOOLEAN NOT NULL DEFAULT TRUE,
    display_order         SMALLINT NOT NULL DEFAULT 0,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT leave_types_code_key UNIQUE (code),
    CONSTRAINT leave_types_name_key UNIQUE (name)
);

-- ---------------------------------------------------------------------------
-- 5. Leave balances — `balance` is generated, so it can never drift
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leave_balances (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     UUID NOT NULL REFERENCES public.profiles(id)    ON DELETE CASCADE,
    leave_type_id   UUID NOT NULL REFERENCES public.leave_types(id) ON DELETE CASCADE,
    year            SMALLINT NOT NULL,
    allocated_days  NUMERIC(5,1) NOT NULL DEFAULT 0,
    taken_days      NUMERIC(5,1) NOT NULL DEFAULT 0,
    carried_forward NUMERIC(5,1) NOT NULL DEFAULT 0,
    adjusted_days   NUMERIC(5,1) NOT NULL DEFAULT 0,
    balance         NUMERIC(5,1) GENERATED ALWAYS AS
                      (allocated_days + carried_forward + adjusted_days - taken_days) STORED,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT leave_balances_unique UNIQUE (employee_id, leave_type_id, year)
);

-- ---------------------------------------------------------------------------
-- 6. Leave requests — supersedes the flat time_off table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id      UUID NOT NULL REFERENCES public.profiles(id)    ON DELETE CASCADE,
    leave_type_id    UUID NOT NULL REFERENCES public.leave_types(id) ON DELETE RESTRICT,
    from_date        DATE NOT NULL,
    to_date          DATE NOT NULL,
    is_half_day      BOOLEAN NOT NULL DEFAULT FALSE,
    total_days       NUMERIC(4,1) NOT NULL DEFAULT 0,
    reason           TEXT NOT NULL DEFAULT '',
    status           leave_status NOT NULL DEFAULT 'PENDING',
    document_url     TEXT,
    applied_on       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_on      TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT leave_requests_date_order CHECK (to_date >= from_date),
    -- A decided request must record who decided it and when.
    CONSTRAINT leave_requests_decision CHECK (
        status = 'PENDING' OR (approved_by IS NOT NULL AND approved_on IS NOT NULL)
    )
);

-- ---------------------------------------------------------------------------
-- 7. Backfill departments and designations from the existing text columns
-- ---------------------------------------------------------------------------
INSERT INTO public.departments (name)
SELECT DISTINCT TRIM(department)
FROM public.profiles
WHERE department IS NOT NULL AND TRIM(department) <> ''
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.designations (department_id, name)
SELECT DISTINCT d.id, TRIM(p.job_position)
FROM public.profiles p
JOIN public.departments d ON d.name = TRIM(p.department)
WHERE p.job_position IS NOT NULL AND TRIM(p.job_position) <> ''
ON CONFLICT (department_id, name) DO NOTHING;

UPDATE public.profiles p
SET department_id = d.id
FROM public.departments d
WHERE d.name = TRIM(p.department) AND p.department_id IS NULL;

UPDATE public.profiles p
SET designation_id = g.id
FROM public.designations g
WHERE g.department_id = p.department_id
  AND g.name = TRIM(p.job_position)
  AND p.designation_id IS NULL;

-- ---------------------------------------------------------------------------
-- 8. Seed leave types, then migrate existing time_off rows
-- ---------------------------------------------------------------------------
INSERT INTO public.leave_types
    (name, code, days_allowed_per_year, is_paid, requires_document, min_notice_days, color_hex, display_order)
VALUES
    ('Paid Leave',   'PAID',   24, TRUE,  FALSE, 2, '#10b981', 1),
    ('Sick Leave',   'SICK',    7, TRUE,  TRUE,  0, '#3b82f6', 2),
    ('Unpaid Leave', 'UNPAID',  0, FALSE, FALSE, 5, '#f59e0b', 3)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.leave_requests
    (employee_id, leave_type_id, from_date, to_date, total_days, status,
     document_url, applied_on, approved_by, approved_on, created_at)
SELECT
    t.user_id,
    lt.id,
    t.start_date,
    t.end_date,
    (t.end_date - t.start_date) + 1,
    COALESCE(t.status, 'PENDING'),
    t.document_url,
    COALESCE(t.created_at, NOW()),
    -- Historic rows have no decision trail; attribute to an admin to satisfy
    -- the decision constraint, leaving PENDING rows untouched.
    CASE WHEN t.status IN ('APPROVED','REJECTED')
         THEN (SELECT id FROM public.profiles WHERE role = 'ADMIN' ORDER BY created_at LIMIT 1) END,
    CASE WHEN t.status IN ('APPROVED','REJECTED') THEN COALESCE(t.created_at, NOW()) END,
    COALESCE(t.created_at, NOW())
FROM public.time_off t
JOIN public.leave_types lt ON lt.code = t.type::TEXT
WHERE NOT EXISTS (
    SELECT 1 FROM public.leave_requests lr
    WHERE lr.employee_id = t.user_id AND lr.from_date = t.start_date AND lr.to_date = t.end_date
);

-- Allocate this year's balances to everyone.
INSERT INTO public.leave_balances (employee_id, leave_type_id, year, allocated_days)
SELECT p.id, lt.id, EXTRACT(YEAR FROM NOW())::SMALLINT, lt.days_allowed_per_year
FROM public.profiles p
CROSS JOIN public.leave_types lt
WHERE lt.is_active
ON CONFLICT (employee_id, leave_type_id, year) DO NOTHING;

-- Reflect already-approved leave in taken_days.
UPDATE public.leave_balances b
SET taken_days = sub.days, updated_at = NOW()
FROM (
    SELECT employee_id, leave_type_id,
           EXTRACT(YEAR FROM from_date)::SMALLINT AS yr,
           SUM(total_days) AS days
    FROM public.leave_requests
    WHERE status = 'APPROVED'
    GROUP BY employee_id, leave_type_id, EXTRACT(YEAR FROM from_date)
) sub
WHERE b.employee_id = sub.employee_id
  AND b.leave_type_id = sub.leave_type_id
  AND b.year = sub.yr;

-- ---------------------------------------------------------------------------
-- 9. Indexes — every foreign key and every column the app filters on
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_designations_department  ON public.designations (department_id) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_profiles_department      ON public.profiles (department_id);
CREATE INDEX IF NOT EXISTS idx_profiles_designation     ON public.profiles (designation_id);
CREATE INDEX IF NOT EXISTS idx_profiles_manager         ON public.profiles (manager_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee  ON public.leave_requests (employee_id, status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status    ON public.leave_requests (status) WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_leave_requests_range     ON public.leave_requests (from_date, to_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_type      ON public.leave_requests (leave_type_id);
CREATE INDEX IF NOT EXISTS idx_leave_balances_lookup    ON public.leave_balances (employee_id, year);
CREATE INDEX IF NOT EXISTS idx_attendance_user_date     ON public.attendance (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_salaries_user            ON public.salaries (user_id);

-- ---------------------------------------------------------------------------
-- 10. Keep updated_at honest
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_departments_touch  ON public.departments;
DROP TRIGGER IF EXISTS trg_designations_touch ON public.designations;
CREATE TRIGGER trg_departments_touch  BEFORE UPDATE ON public.departments  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_designations_touch BEFORE UPDATE ON public.designations FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 11. Row level security
-- ---------------------------------------------------------------------------
ALTER TABLE public.departments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_types     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read departments"      ON public.departments;
DROP POLICY IF EXISTS "Admins manage departments"        ON public.departments;
DROP POLICY IF EXISTS "Anyone can read designations"     ON public.designations;
DROP POLICY IF EXISTS "Admins manage designations"       ON public.designations;
DROP POLICY IF EXISTS "Anyone can read leave types"      ON public.leave_types;
DROP POLICY IF EXISTS "Admins manage leave types"        ON public.leave_types;
DROP POLICY IF EXISTS "Users read own balances"          ON public.leave_balances;
DROP POLICY IF EXISTS "Admins manage balances"           ON public.leave_balances;
DROP POLICY IF EXISTS "Users manage own leave requests"  ON public.leave_requests;
DROP POLICY IF EXISTS "Admins manage leave requests"     ON public.leave_requests;

CREATE POLICY "Anyone can read departments"     ON public.departments    FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage departments"       ON public.departments    FOR ALL    USING (is_admin());
CREATE POLICY "Anyone can read designations"    ON public.designations   FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage designations"      ON public.designations   FOR ALL    USING (is_admin());
CREATE POLICY "Anyone can read leave types"     ON public.leave_types    FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage leave types"       ON public.leave_types    FOR ALL    USING (is_admin());
CREATE POLICY "Users read own balances"         ON public.leave_balances FOR SELECT USING (auth.uid() = employee_id);
CREATE POLICY "Admins manage balances"          ON public.leave_balances FOR ALL    USING (is_admin());
CREATE POLICY "Users manage own leave requests" ON public.leave_requests FOR ALL    USING (auth.uid() = employee_id);
CREATE POLICY "Admins manage leave requests"    ON public.leave_requests FOR ALL    USING (is_admin());

-- ---------------------------------------------------------------------------
-- 12. Views — one round trip instead of client-side joins
-- ---------------------------------------------------------------------------

-- Employee directory with department/designation resolved.
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
    p.created_at
FROM public.profiles p
LEFT JOIN public.departments  d ON d.id = p.department_id
LEFT JOIN public.designations g ON g.id = p.designation_id
LEFT JOIN public.profiles     m ON m.id = p.manager_id;

-- Leave requests with employee + type resolved, ready to render.
CREATE OR REPLACE VIEW public.leave_request_details AS
SELECT
    lr.id,
    lr.employee_id,
    p.first_name || ' ' || p.last_name AS employee_name,
    d.name                             AS department_name,
    lr.leave_type_id,
    lt.name                            AS leave_type_name,
    lt.code                            AS leave_type_code,
    lt.color_hex                       AS leave_type_color,
    lt.is_paid,
    lr.from_date,
    lr.to_date,
    lr.is_half_day,
    lr.total_days,
    lr.reason,
    lr.status,
    lr.document_url,
    lr.applied_on,
    lr.approved_by,
    a.first_name || ' ' || a.last_name AS approved_by_name,
    lr.approved_on,
    lr.rejection_reason,
    lr.created_at
FROM public.leave_requests lr
JOIN public.profiles    p  ON p.id  = lr.employee_id
JOIN public.leave_types lt ON lt.id = lr.leave_type_id
LEFT JOIN public.departments d ON d.id = p.department_id
LEFT JOIN public.profiles    a ON a.id = lr.approved_by;

-- Department roll-up for the Departments screen (no N+1 from the client).
CREATE OR REPLACE VIEW public.department_summary AS
SELECT
    d.id,
    d.name,
    d.code,
    d.is_active,
    d.head_id,
    h.first_name || ' ' || h.last_name                     AS head_name,
    COUNT(DISTINCT p.id)                                   AS headcount,
    COUNT(DISTINCT p.id) FILTER (WHERE p.role = 'ADMIN')   AS admin_count,
    COUNT(DISTINCT g.id)                                   AS designation_count
FROM public.departments d
LEFT JOIN public.profiles     p ON p.department_id = d.id
LEFT JOIN public.designations g ON g.department_id = d.id AND g.is_active
LEFT JOIN public.profiles     h ON h.id = d.head_id
GROUP BY d.id, d.name, d.code, d.is_active, d.head_id, h.first_name, h.last_name;

COMMIT;
