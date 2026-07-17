-- =============================================================================
-- 021_vnpay_transactions.sql
-- Stores VNPay payment transaction history with full RLS protection.
-- The payments table continues to store the payment records (created after IPN
-- confirmation), while this table tracks the raw VNPay responses for audit.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.vnpay_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core transaction fields
    vnp_txn_ref       VARCHAR(64)  NOT NULL UNIQUE,  -- vnp_TxnRef
    vnp_amount        BIGINT       NOT NULL,          -- vnp_Amount (VNPay sends in x100)
    vnp_order_info    TEXT,
    vnp_bank_code     VARCHAR(20),
    vnp_bank_tran_no  VARCHAR(64),
    vnp_card_type     VARCHAR(20),
    vnp_response_code VARCHAR(10),                    -- vnp_ResponseCode
    vnp_transaction_no BIGINT,                        -- vnp_TransactionNo
    vnp_transaction_status VARCHAR(10),               -- vnp_TransactionStatus
    vnp_tmn_code      VARCHAR(16),                    -- vnp_TmnCode (merchant code)
    vnp_secure_hash   TEXT,                          -- vnp_SecureHash
    vnp_version       VARCHAR(8)  DEFAULT '2.1.0',
    vnp_command       VARCHAR(8)  DEFAULT 'pay',
    
    -- Linkage
    membership_id     UUID REFERENCES public.memberships(id) ON DELETE SET NULL,
    payment_id        UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    
    -- Status tracking
    status            VARCHAR(20) DEFAULT 'pending',  -- pending | completed | failed
    ipn_processed     BOOLEAN DEFAULT FALSE,
    ipn_processed_at  TIMESTAMPTZ,
    error_message     TEXT,
    
    -- Timing
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_vnpay_txn_ref        ON public.vnpay_transactions(vnp_txn_ref);
CREATE INDEX IF NOT EXISTS idx_vnpay_membership_id  ON public.vnpay_transactions(membership_id);
CREATE INDEX IF NOT EXISTS idx_vnpay_status         ON public.vnpay_transactions(status);
CREATE INDEX IF NOT EXISTS idx_vnpay_response_code  ON public.vnpay_transactions(vnp_response_code);

-- RLS
ALTER TABLE public.vnpay_transactions ENABLE ROW LEVEL SECURITY;

-- Users can read their own VNPay transactions (via membership link)
CREATE POLICY "vnpay_txn_owners_read_own"
  ON public.vnpay_transactions
  FOR SELECT
  USING (
    membership_id IN (
      SELECT id FROM public.memberships WHERE profile_id = auth.uid()
    )
  );

-- Authenticated users can insert (initiated from frontend via edge function)
CREATE POLICY "authenticated_insert_vnpay_txn"
  ON public.vnpay_transactions
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Only service role can update (edge function + admin)
CREATE POLICY "service_role_update_vnpay_txn"
  ON public.vnpay_transactions
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_vnpay_txn_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_vnpay_txn_updated_at ON public.vnpay_transactions;
CREATE TRIGGER trg_vnpay_txn_updated_at
  BEFORE UPDATE ON public.vnpay_transactions
  FOR EACH ROW EXECUTE FUNCTION update_vnpay_txn_updated_at();
