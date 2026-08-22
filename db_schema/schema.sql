-- Supabase Schema DDL for HRMS MVP Application

-- 1. Create Enums if not present
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'EMPLOYEE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('PRESENT', 'ABSENT', 'LEAVE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE leave_type AS ENUM ('PAID', 'SICK', 'UNPAID');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE leave_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Profiles Table (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    login_id VARCHAR(50) UNIQUE NOT NULL,
    role user_role DEFAULT 'EMPLOYEE'::user_role NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    department VARCHAR(100),
    manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    avatar_url TEXT,
    about TEXT,
    skills TEXT[],
    certifications TEXT[],
    address TEXT,
    personal_email VARCHAR(255),
    nationality VARCHAR(100),
    gender VARCHAR(20),
    date_of_birth DATE,
    bank_name VARCHAR(100),
    bank_account_number VARCHAR(100),
    bank_ifsc VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ensure all optional columns exist if table was created previously without them
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
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
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Salaries Table
CREATE TABLE IF NOT EXISTS public.salaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    fixed_wage NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
    basic_salary NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
    hra NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
    standard_allowance NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
    pf NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
    tax NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Attendance Table
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIMESTAMPTZ NOT NULL,
    check_out TIMESTAMPTZ,
    status attendance_status DEFAULT 'PRESENT'::attendance_status NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, date)
);

ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 5. TimeOff Table
CREATE TABLE IF NOT EXISTS public.time_off (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type leave_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    document_url TEXT,
    status leave_status DEFAULT 'PENDING'::leave_status NOT NULL,
    admin_comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.time_off ADD COLUMN IF NOT EXISTS reason TEXT;

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_off ENABLE ROW LEVEL SECURITY;

-- Permissive RLS policies for application access
CREATE POLICY "Allow public select profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert/update profiles" ON public.profiles FOR ALL USING (true);

CREATE POLICY "Allow access salaries" ON public.salaries FOR ALL USING (true);
CREATE POLICY "Allow access attendance" ON public.attendance FOR ALL USING (true);
CREATE POLICY "Allow access time_off" ON public.time_off FOR ALL USING (true);
