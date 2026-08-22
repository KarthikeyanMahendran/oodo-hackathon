-- Supabase schema for the HRMS application.
-- Mirrors the live project (xczcsqaxgbgwlhzhgldi) as of 2026-08-22.

-- ---------------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------------
DO $$ BEGIN CREATE TYPE user_role        AS ENUM ('ADMIN', 'EMPLOYEE');            EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE attendance_status AS ENUM ('PRESENT', 'ABSENT', 'LEAVE');   EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE leave_type        AS ENUM ('PAID', 'SICK', 'UNPAID');       EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE leave_status      AS ENUM ('PENDING', 'APPROVED', 'REJECTED'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ---------------------------------------------------------------------------
-- 2. profiles — extends auth.users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    login_id             VARCHAR(50) UNIQUE NOT NULL,
    role                 user_role DEFAULT 'EMPLOYEE'::user_role NOT NULL,
    first_name           VARCHAR(100) NOT NULL,
    last_name            VARCHAR(100) NOT NULL,
    email                VARCHAR(255),
    phone                VARCHAR(50),
    department           VARCHAR(100),
    job_position         VARCHAR(100),
    date_of_joining      DATE,
    manager_id           UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    avatar_url           TEXT,
    about                TEXT,
    skills               TEXT[],
    certifications       TEXT[],
    address              TEXT,
    personal_email       VARCHAR(255),
    nationality          VARCHAR(100),
    gender               VARCHAR(20),
    date_of_birth        DATE,
    bank_name            VARCHAR(100),
    bank_account_number  VARCHAR(100),
    bank_ifsc            VARCHAR(50),
    must_change_password BOOLEAN DEFAULT FALSE,
    created_at           TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at           TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ensure all optional columns exist if table was created previously without them
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS job_position VARCHAR(100);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_joining DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS about TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skills TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS certifications TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS personal_email VARCHAR(255);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nationality VARCHAR(100);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(100);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_ifsc VARCHAR(50);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Salaries Table
>>>>>>> feature/esign-and-password-reset
CREATE TABLE IF NOT EXISTS public.salaries (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    fixed_wage         NUMERIC(12,2) DEFAULT 0.00,
    basic_salary       NUMERIC(12,2) DEFAULT 0.00,
    hra                NUMERIC(12,2) DEFAULT 0.00,
    standard_allowance NUMERIC(12,2) DEFAULT 0.00,
    pf                 NUMERIC(12,2) DEFAULT 0.00,
    tax                NUMERIC(12,2) DEFAULT 0.00,
    updated_at         TIMESTAMPTZ DEFAULT NOW()
);
-- NOTE: performance_bonus, LTA and fixed_allowance are NOT stored. They are
-- derived at read time by src/lib/utils/salaryCalculator.ts from fixed_wage.

-- ---------------------------------------------------------------------------
-- 4. attendance — one row per employee per day
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date      DATE NOT NULL,
    check_in  TIMESTAMPTZ NOT NULL,
    check_out TIMESTAMPTZ,
    status    attendance_status DEFAULT 'PRESENT'::attendance_status,
    UNIQUE(user_id, date)
);

-- ---------------------------------------------------------------------------
-- 5. time_off — leave requests and their approval state
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.time_off (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type          leave_type NOT NULL,
    start_date    DATE NOT NULL,
    end_date      DATE NOT NULL,
    document_url  TEXT,
    status        leave_status DEFAULT 'PENDING'::leave_status,
    admin_comment TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 6. e-signature tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.esign_template_types (
    template_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR(255) NOT NULL,
    signer_config JSONB,
    document_url  TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.esign_envelopes (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id            UUID REFERENCES public.esign_template_types(template_id) ON DELETE SET NULL,
    docuseal_submission_id VARCHAR(255) UNIQUE,
    document_name          VARCHAR(255) NOT NULL,
    status                 VARCHAR(50) NOT NULL,
    signed_document_url    TEXT,
    signed_on              TIMESTAMPTZ,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 7. Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salaries             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_off             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.esign_template_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.esign_envelopes      ENABLE ROW LEVEL SECURITY;

-- Helper used by every admin policy below.
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN'::user_role
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE POLICY "Admins have full access to profiles"   ON public.profiles   FOR ALL    USING (is_admin());
CREATE POLICY "Users can view own profile"            ON public.profiles   FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"          ON public.profiles   FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins have full access to salaries"   ON public.salaries   FOR ALL    USING (is_admin());
CREATE POLICY "Users can view own salary"             ON public.salaries   FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins have full access to attendance" ON public.attendance FOR ALL    USING (is_admin());
CREATE POLICY "Users can manage own attendance"       ON public.attendance FOR ALL    USING (auth.uid() = user_id);

CREATE POLICY "Admins have full access to time_off"   ON public.time_off   FOR ALL    USING (is_admin());
CREATE POLICY "Users can manage own time_off"         ON public.time_off   FOR ALL    USING (auth.uid() = user_id);

CREATE POLICY "Allow access esign_template_types" ON public.esign_template_types FOR ALL USING (true);
CREATE POLICY "Allow access esign_envelopes"      ON public.esign_envelopes      FOR ALL USING (true);

-- ---------------------------------------------------------------------------
-- 8. Add-on Features: claims, it_assets, company_feed
-- ---------------------------------------------------------------------------
DO $$ BEGIN CREATE TYPE claim_type   AS ENUM ('EXPENSE', 'MEDICAL');             EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE claim_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE asset_status AS ENUM ('AVAILABLE', 'ASSIGNED', 'RECOVERED', 'UNDER_REPAIR'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE post_type    AS ENUM ('ANNOUNCEMENT', 'QUESTION');       EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.claims (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type                 claim_type NOT NULL,
    amount               DECIMAL(10, 2),
    merchant_or_provider VARCHAR(255),
    event_date           DATE,
    description          TEXT,
    document_url         TEXT NOT NULL,
    status               claim_status DEFAULT 'PENDING',
    admin_comment        TEXT,
    created_at           TIMESTAMPTZ DEFAULT NOW(),
    updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.it_assets (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_name    VARCHAR(255) NOT NULL,
    serial_number VARCHAR(255) UNIQUE NOT NULL,
    status        asset_status DEFAULT 'AVAILABLE',
    assigned_to   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_date TIMESTAMPTZ,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.company_feed (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_type  post_type NOT NULL,
    content    TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.claims       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.it_assets    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow access claims"       ON public.claims       FOR ALL USING (true);
CREATE POLICY "Allow access it_assets"    ON public.it_assets    FOR ALL USING (true);
CREATE POLICY "Allow access company_feed" ON public.company_feed FOR ALL USING (true);
