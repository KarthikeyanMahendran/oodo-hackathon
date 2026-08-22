-- =========================================================
-- DAYFLOW HRMS SUPABASE AUTH & SEED DATA SQL SCRIPT
-- Copy & Paste this entire script into Supabase SQL Editor
-- =========================================================

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Insert Sarah Jenkins (HR ADMIN) into auth.users
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
) VALUES (
    'a1111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'sarah.jenkins@acme.com',
    crypt('pass123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"first_name":"Sarah","last_name":"Jenkins"}'::jsonb,
    now(),
    now()
) ON CONFLICT (id) DO NOTHING;

-- 2. Insert Marcus Chen (EMPLOYEE) into auth.users
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
) VALUES (
    'e2222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'marcus.chen@acme.com',
    crypt('pass123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"first_name":"Marcus","last_name":"Chen"}'::jsonb,
    now(),
    now()
) ON CONFLICT (id) DO NOTHING;

-- 3. Insert Alex Rivera (EMPLOYEE) into auth.users
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
) VALUES (
    'e3333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'alex.rivera@acme.com',
    crypt('pass123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"first_name":"Alex","last_name":"Rivera"}'::jsonb,
    now(),
    now()
) ON CONFLICT (id) DO NOTHING;

-- 4. Insert Elena Rostova (EMPLOYEE) into auth.users
INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
    'e4444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'elena.rostova@acme.com', crypt('pass123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Elena","last_name":"Rostova"}'::jsonb, now(), now()
) ON CONFLICT (id) DO NOTHING;

-- 5. Insert Devon Vance (EMPLOYEE) into auth.users
INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
    'e5555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'devon.vance@acme.com', crypt('pass123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Devon","last_name":"Vance"}'::jsonb, now(), now()
) ON CONFLICT (id) DO NOTHING;

-- 6. Insert Profiles into public.profiles
INSERT INTO public.profiles (
    id, login_id, role, first_name, last_name, email, phone, department, job_position, date_of_joining, avatar_url, about
) VALUES 
(
    'a1111111-1111-1111-1111-111111111111', 'OISAJE20260001', 'ADMIN', 'Sarah', 'Jenkins', 'sarah.jenkins@acme.com', '+1 (555) 019-2834', 'Human Resources', 'VP of Human Resources', '2022-03-15', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', 'Senior VP of Human Resources leading organizational development, talent acquisition, and employee engagement.'
),
(
    'e2222222-2222-2222-2222-222222222222', 'OIMACH20260003', 'EMPLOYEE', 'Marcus', 'Chen', 'marcus.chen@acme.com', '+1 (555) 782-9301', 'Engineering', 'Senior Backend Engineer', '2023-06-01', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'Senior Backend Systems Architect specializing in distributed cloud services, PostgreSQL, and node.js microservices.'
),
(
    'e3333333-3333-3333-3333-333333333333', 'OIALRI20260002', 'EMPLOYEE', 'Alex', 'Rivera', 'alex.rivera@acme.com', '+1 (555) 392-1049', 'Product & Design', 'Lead UX/UI Designer', '2023-01-10', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'Lead UX/UI Designer passionate about crafting intuitive user experiences and modern visual design systems.'
),
(
    'e4444444-4444-4444-4444-444444444444', 'OIELRO20260004', 'EMPLOYEE', 'Elena', 'Rostova', 'elena.rostova@acme.com', '+1 (555) 849-2018', 'Marketing', 'Growth Marketing Director', '2024-02-15', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', 'Growth Marketing Director executing data-driven brand strategies and performance marketing campaigns.'
),
(
    'e5555555-5555-5555-5555-555555555555', 'OIDEVA20260005', 'EMPLOYEE', 'Devon', 'Vance', 'devon.vance@acme.com', '+1 (555) 671-8293', 'Finance', 'Senior Financial Analyst', '2024-09-01', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 'Corporate Financial Analyst handling budget forecasting, financial reporting, and statutory compliance.'
)
ON CONFLICT (id) DO UPDATE SET 
    login_id = EXCLUDED.login_id,
    role = EXCLUDED.role,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name;

-- 7. Insert Salaries into public.salaries
INSERT INTO public.salaries (user_id, fixed_wage, basic_salary, hra, standard_allowance, pf, tax)
VALUES
('a1111111-1111-1111-1111-111111111111', 150000, 75000, 37500, 12495, 9000, 200),
('e2222222-2222-2222-2222-222222222222', 135000, 67500, 33750, 11246, 8100, 200),
('e3333333-3333-3333-3333-333333333333', 120000, 60000, 30000, 9996, 7200, 200),
('e4444444-4444-4444-4444-444444444444', 95000, 47500, 23750, 7914, 5700, 200),
('e5555555-5555-5555-5555-555555555555', 85000, 42500, 21250, 7081, 5100, 200)
ON CONFLICT (user_id) DO NOTHING;
