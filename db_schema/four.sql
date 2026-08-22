-- ==========================================
-- 1. ENUM DEFINITIONS (IDEMPOTENT / SAFE RE-RUN)
-- ==========================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('ADMIN', 'EMPLOYEE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status') THEN
        CREATE TYPE attendance_status AS ENUM ('PRESENT', 'ABSENT', 'LEAVE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leave_type') THEN
        CREATE TYPE leave_type AS ENUM ('PAID', 'SICK', 'UNPAID');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leave_status') THEN
        CREATE TYPE leave_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'claim_type') THEN
        CREATE TYPE claim_type AS ENUM ('EXPENSE', 'MEDICAL');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'claim_status') THEN
        CREATE TYPE claim_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_status') THEN
        CREATE TYPE asset_status AS ENUM ('AVAILABLE', 'ASSIGNED', 'RECOVERED', 'UNDER_REPAIR');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'post_type') THEN
        CREATE TYPE post_type AS ENUM ('ANNOUNCEMENT', 'QUESTION');
    END IF;
END $$;

-- ==========================================
-- 2. CORE MVP TABLES
-- ==========================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    login_id VARCHAR UNIQUE NOT NULL,
    role user_role DEFAULT 'EMPLOYEE',
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    department VARCHAR,
    manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    avatar_url TEXT,
    must_change_password BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS salaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    fixed_wage DECIMAL(12, 2) DEFAULT 0.00,
    basic_salary DECIMAL(12, 2) DEFAULT 0.00,
    hra DECIMAL(12, 2) DEFAULT 0.00,
    standard_allowance DECIMAL(12, 2) DEFAULT 0.00,
    pf DECIMAL(12, 2) DEFAULT 0.00,
    tax DECIMAL(12, 2) DEFAULT 0.00,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIMESTAMPTZ NOT NULL,
    check_out TIMESTAMPTZ,
    status attendance_status DEFAULT 'PRESENT',
    UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS time_off (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type leave_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    document_url TEXT,
    status leave_status DEFAULT 'PENDING',
    admin_comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE time_off ADD COLUMN IF NOT EXISTS admin_comment TEXT;

-- ==========================================
-- 3. E-SIGNATURE TABLE (Single consolidated table)
-- ==========================================
DROP TABLE IF EXISTS esign_envelopes CASCADE;
DROP TABLE IF EXISTS esign_template_types CASCADE;

CREATE TABLE IF NOT EXISTS esign_envelopes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_name VARCHAR NOT NULL,
    document_url TEXT NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    signer_name VARCHAR NOT NULL,
    signer_email VARCHAR NOT NULL,
    signer_role VARCHAR DEFAULT 'Participant',
    docuseal_submission_id VARCHAR UNIQUE,
    status VARCHAR DEFAULT 'Pending',
    signed_document_url TEXT,
    signed_on TIMESTAMPTZ,
    placed_fields JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. NEW ADD-ON FEATURES (CLAIMS, ASSETS, FEED)
-- ==========================================
CREATE TABLE IF NOT EXISTS claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type claim_type NOT NULL,
    amount DECIMAL(10, 2),
    merchant_or_provider VARCHAR,
    event_date DATE,
    description TEXT,
    document_url TEXT NOT NULL,
    status claim_status DEFAULT 'PENDING',
    admin_comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS it_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_name VARCHAR NOT NULL,
    serial_number VARCHAR UNIQUE NOT NULL,
    status asset_status DEFAULT 'AVAILABLE',
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    assigned_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_feed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    post_type post_type NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. ROW LEVEL SECURITY (RLS) & POLICIES
-- ==========================================
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN');
$$ LANGUAGE sql SECURITY DEFINER;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off ENABLE ROW LEVEL SECURITY;
ALTER TABLE esign_envelopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE it_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_feed ENABLE ROW LEVEL SECURITY;

-- Core Policies
DROP POLICY IF EXISTS "Users view/update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins full access profiles" ON profiles;
DROP POLICY IF EXISTS "Everyone can view profiles" ON profiles;
CREATE POLICY "Everyone can view profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins full access profiles" ON profiles FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Users view own salary" ON salaries;
DROP POLICY IF EXISTS "Admins full access salaries" ON salaries;
CREATE POLICY "Users view own salary" ON salaries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins full access salaries" ON salaries FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Users manage own attendance" ON attendance;
DROP POLICY IF EXISTS "Admins full access attendance" ON attendance;
CREATE POLICY "Users manage own attendance" ON attendance FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins full access attendance" ON attendance FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Users manage own time_off" ON time_off;
DROP POLICY IF EXISTS "Admins full access time_off" ON time_off;
CREATE POLICY "Users manage own time_off" ON time_off FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins full access time_off" ON time_off FOR ALL USING (is_admin());

-- E-Sign Policies
DROP POLICY IF EXISTS "Allow access esign_envelopes" ON esign_envelopes;
CREATE POLICY "Allow access esign_envelopes" ON esign_envelopes FOR ALL USING (true);

-- Add-On Policies
DROP POLICY IF EXISTS "Users manage own claims" ON claims;
DROP POLICY IF EXISTS "Admins full access claims" ON claims;
CREATE POLICY "Users manage own claims" ON claims FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins full access claims" ON claims FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Users view own assigned assets" ON it_assets;
DROP POLICY IF EXISTS "Admins full access assets" ON it_assets;
CREATE POLICY "Users view own assigned assets" ON it_assets FOR SELECT USING (assigned_to IS NULL OR auth.uid() = assigned_to);
CREATE POLICY "Admins full access assets" ON it_assets FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Everyone can read feed" ON company_feed;
DROP POLICY IF EXISTS "Users create posts" ON company_feed;
DROP POLICY IF EXISTS "Admins manage all posts" ON company_feed;
CREATE POLICY "Everyone can read feed" ON company_feed FOR SELECT USING (true);
CREATE POLICY "Users create posts" ON company_feed FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Admins manage all posts" ON company_feed FOR ALL USING (is_admin());