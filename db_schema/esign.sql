-- Table 1: E-Sign Templates (Blueprint definitions)
CREATE TABLE IF NOT EXISTS public.esign_template_types (
    template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR NOT NULL,
    signer_config JSONB, -- Stores JSON array of {role, tabs[]}
    document_url TEXT, -- Path to original PDF in Supabase Storage
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table 2: Sent Documents (Envelope instances)
CREATE TABLE IF NOT EXISTS public.esign_envelopes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES public.esign_template_types(template_id) ON DELETE SET NULL,
    docuseal_submission_id VARCHAR NOT NULL UNIQUE, -- DocuSeal submission_id
    document_name VARCHAR NOT NULL,
    status VARCHAR DEFAULT 'Pending' NOT NULL, -- 'Pending', 'Signed', 'Voided'
    signed_document_url TEXT, -- Path to completed PDF
    signed_on TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS and permissive policies
ALTER TABLE public.esign_template_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.esign_envelopes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Allow access esign_template_types" ON public.esign_template_types FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow access esign_envelopes" ON public.esign_envelopes FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;