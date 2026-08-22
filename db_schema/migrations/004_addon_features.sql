-- ============================================================================
-- 004 — Claims (expense/medical), IT assets, company feed
--
-- Idempotent and non-destructive. These three tables back the Expenses, IT
-- Assets and Notice Board pages. Until this migration runs, those pages and
-- their API routes (src/app/api/{expenses,assets,feed}/*) fall back to
-- in-memory demo content — see src/lib/store/{feedStore,itAssetsStore}.ts —
-- so the app works either way; running this makes their data real and
-- persisted instead of demo-only.
-- ============================================================================

BEGIN;

DO $$ BEGIN CREATE TYPE claim_type   AS ENUM ('EXPENSE', 'MEDICAL');              EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE claim_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE asset_status AS ENUM ('AVAILABLE', 'ASSIGNED', 'RECOVERED', 'UNDER_REPAIR'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE post_type    AS ENUM ('ANNOUNCEMENT', 'QUESTION');        EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ---------------------------------------------------------------------------
-- Claims — expense and medical reimbursement requests
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.claims (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type                 claim_type NOT NULL,
    amount               NUMERIC(10,2),
    merchant_or_provider VARCHAR(255),
    event_date           DATE,
    description          TEXT,
    document_url         TEXT NOT NULL,
    status               claim_status NOT NULL DEFAULT 'PENDING',
    admin_comment        TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- IT assets — equipment inventory and assignment
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.it_assets (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_name    VARCHAR(255) NOT NULL,
    serial_number VARCHAR(255) NOT NULL UNIQUE,
    status        asset_status NOT NULL DEFAULT 'AVAILABLE',
    assigned_to   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_date TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Company feed — notice board posts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.company_feed (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_type  post_type NOT NULL,
    content    TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_claims_user       ON public.claims (user_id, status);
CREATE INDEX IF NOT EXISTS idx_claims_status     ON public.claims (status) WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_it_assets_assigned ON public.it_assets (assigned_to);
CREATE INDEX IF NOT EXISTS idx_company_feed_created ON public.company_feed (created_at DESC);

-- ---------------------------------------------------------------------------
-- Keep updated_at honest (reuses the trigger function from migration 002)
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_claims_touch    ON public.claims;
DROP TRIGGER IF EXISTS trg_it_assets_touch ON public.it_assets;
CREATE TRIGGER trg_claims_touch    BEFORE UPDATE ON public.claims    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_it_assets_touch BEFORE UPDATE ON public.it_assets FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
ALTER TABLE public.claims       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.it_assets    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_feed ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own claims"    ON public.claims;
DROP POLICY IF EXISTS "Admins manage claims"       ON public.claims;
DROP POLICY IF EXISTS "Users view assigned assets" ON public.it_assets;
DROP POLICY IF EXISTS "Admins manage assets"       ON public.it_assets;
DROP POLICY IF EXISTS "Everyone reads feed"        ON public.company_feed;
DROP POLICY IF EXISTS "Users create posts"         ON public.company_feed;
DROP POLICY IF EXISTS "Admins manage feed"         ON public.company_feed;

CREATE POLICY "Users manage own claims"    ON public.claims       FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "Admins manage claims"       ON public.claims       FOR ALL    USING (is_admin());
CREATE POLICY "Users view assigned assets" ON public.it_assets    FOR SELECT USING (auth.uid() = assigned_to);
CREATE POLICY "Admins manage assets"       ON public.it_assets    FOR ALL    USING (is_admin());
CREATE POLICY "Everyone reads feed"        ON public.company_feed FOR SELECT USING (TRUE);
CREATE POLICY "Users create posts"         ON public.company_feed FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Admins manage feed"         ON public.company_feed FOR ALL    USING (is_admin());

COMMIT;
