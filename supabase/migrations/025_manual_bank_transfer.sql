-- =============================================================================
-- 025_manual_bank_transfer.sql
-- Replace the VNPay-merchant flow with a manual bank-transfer flow.
--
-- Why:
--   - User wants to collect payments into a personal bank account instead
--     of a VNPay merchant account.
--   - VNPay sandbox code (migration 021, vnpay-payment / vnpay-ipn edge
--     functions) is removed by this migration in spirit, but those rows
--     and tables are left intact for now — they're prefixed with `vnpay_`
--     and harmless if unused.
--
-- How the new flow works:
--   1. Member opens PaymentModal → it POSTs to edge function
--      `payment-create` (in supabase/functions/).
--   2. Edge function picks the active bank account from
--      payment_bank_accounts, generates a short txn_ref (CLBxxxx), and
--      inserts a `payments` row with status='pending', payment_method
--      ='manual_bank', transfer_content=txn_ref.
--   3. Modal renders the QR + bank details for the user to scan / copy.
--      User initiates the transfer in their banking app, including the
--      txn_ref in the description.
--   4. Confirmation happens by EITHER:
--        (a) Casso.vn / Sepay.vn webhook → payment-casso-webhook edge
--            function finds the matching pending payment by txn_ref and
--            marks it completed.
--        (b) A leader/admin manually approves the payment in the leader
--            finance dashboard (uploads receipt image, clicks confirm).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Bank account config. Single-row by convention (`is_active = true`
--    with LIMIT 1 in queries) but the schema supports multiple accounts
--    for future use (e.g. multiple banks, or per-club accounts).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_bank_accounts (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_code       TEXT        NOT NULL,                  -- 'VCB', 'TCB', 'MB'… (used in VietQR image URLs)
    bank_name       TEXT        NOT NULL,                  -- display name, e.g. 'Vietcombank'
    account_number  TEXT        NOT NULL,
    account_name    TEXT        NOT NULL,                  -- uppercase, no diacritics (must match bank records)
    is_active       BOOLEAN     NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- updated_at trigger (reuse the one created in 024)
DROP TRIGGER IF EXISTS trg_payment_bank_accounts_updated_at ON public.payment_bank_accounts;
CREATE TRIGGER trg_payment_bank_accounts_updated_at
    BEFORE UPDATE ON public.payment_bank_accounts
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. Extend payments with transfer-specific fields. Existing columns are
--    preserved — payment_method is widened to accept the new value.
-- ---------------------------------------------------------------------------
ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS transfer_content    TEXT,             -- the txn_ref user must include in CK description
    ADD COLUMN IF NOT EXISTS receipt_image_url   TEXT,             -- uploaded bill (manual confirm path)
    ADD COLUMN IF NOT EXISTS confirmed_by        UUID REFERENCES public.profiles(id),
    ADD COLUMN IF NOT EXISTS confirmed_at        TIMESTAMPTZ;

-- Expand payment_method check (already no constraint, but be explicit)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'payments_payment_method_check'
    ) THEN
        ALTER TABLE public.payments
            ADD CONSTRAINT payments_payment_method_check
            CHECK (payment_method IN ('sandbox', 'manual_bank', 'vnpay'));
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Indexes — the webhook handler does a single-row lookup by
--    transfer_content (substring match in the bank description).
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_payments_transfer_content
    ON public.payments(transfer_content)
    WHERE status = 'pending' AND transfer_content IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_bank_accounts_active
    ON public.payment_bank_accounts(is_active)
    WHERE is_active = true;

-- ---------------------------------------------------------------------------
-- 4. RLS — anyone authenticated can READ the active account so the modal
--    can render bank info; only admins / managers can INSERT/UPDATE/DELETE.
-- ---------------------------------------------------------------------------
ALTER TABLE public.payment_bank_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view active bank account" ON public.payment_bank_accounts;
CREATE POLICY "Authenticated users can view active bank account"
    ON public.payment_bank_accounts
    FOR SELECT TO authenticated
    USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage bank accounts" ON public.payment_bank_accounts;
CREATE POLICY "Admins can manage bank accounts"
    ON public.payment_bank_accounts
    FOR ALL TO authenticated
    USING (
        public.has_role('Administrator') OR public.has_role('Manager')
    )
    WITH CHECK (
        public.has_role('Administrator') OR public.has_role('Manager')
    );

-- ---------------------------------------------------------------------------
-- 5. Storage bucket for receipt images (manual confirm path).
--    Bucket is created idempotently so re-running this migration is safe.
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-receipts', 'payment-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload receipts to their own folder (path = `${user_id}/${payment_id}.jpg`).
DROP POLICY IF EXISTS "Users can upload own receipts" ON storage.objects;
CREATE POLICY "Users can upload own receipts"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'payment-receipts'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Owner can read their own receipts; leaders can read receipts for their club.
DROP POLICY IF EXISTS "Users can view own receipts" ON storage.objects;
CREATE POLICY "Users can view own receipts"
    ON storage.objects FOR SELECT TO authenticated
    USING (
        bucket_id = 'payment-receipts'
        AND (
            (storage.foldername(name))[1] = auth.uid()::text
            OR public.has_role('Administrator')
            OR public.has_role('Manager')
        )
    );