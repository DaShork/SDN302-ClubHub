# Manual Bank-Transfer Payment

Thay thế flow VNPay-merchant bằng CK trực tiếp vào tài khoản cá nhân của user.

## Luồng hoạt động

```
User bấm "Đóng quỹ"
       │
       ▼
PaymentModal POST → payment-create edge function
       │   (tạo payments row: status=pending, transfer_content=CLBxxxx)
       ▼
Render QR (VietQR) + bank info + copy buttons
       │
       ▼
User mở app ngân hàng → quét QR / nhập thủ công → CK
       │
       ▼ (2 nguồn xác nhận song song)
       │
   ┌───┴────────────────────────────────┐
   ▼                                    ▼
Casso / Sepay webhook              Leader duyệt tay
(payment-casso-webhook /          (payment-manual-confirm)
 payment-sepay-webhook)           upload ảnh bill → bấm confirm
   │                                    │
   ▼                                    ▼
UPDATE payments SET status='completed'
```

## Cấu trúc files

| File | Vai trò |
|---|---|
| `supabase/migrations/025_manual_bank_transfer.sql` | Tạo bảng `payment_bank_accounts`, thêm cột cho `payments`, RLS, storage bucket cho receipt |
| `supabase/functions/payment-create/index.ts` | Tạo pending payment + trả QR/bank info |
| `supabase/functions/payment-casso-webhook/index.ts` | Webhook nhận giao dịch từ Casso.vn |
| `supabase/functions/payment-sepay-webhook/index.ts` | Webhook nhận giao dịch từ Sepay.vn |
| `supabase/functions/payment-manual-confirm/index.ts` | Leader/admin duyệt pending payment |
| `frontend/src/components/PaymentModal/PaymentModal.jsx` | Modal CK với QR + poll realtime |
| `frontend/src/services/manualPaymentService.js` | Client call edge function |

## Setup

### 1. Chạy migration

```bash
# Local
supabase db reset

# Production
psql -h <db-host> -U postgres -d postgres -f supabase/migrations/025_manual_bank_transfer.sql
```

### 2. Thêm tài khoản ngân hàng vào DB

```sql
INSERT INTO payment_bank_accounts (bank_code, bank_name, account_number, account_name)
VALUES ('VCB', 'Vietcombank', '1234567890', 'NGUYEN VAN A');
```

`bank_code` phải là 1 trong: VCB, TCB, MB, ACB, BIDV, VTB, SCB, EIB, HDB, MSB, SHB, LPB, VIB, TPB, OCB, NAB, BVB, NCB, PGB, GPB, VCCB, ABB, KLB, BAB, SEAB (theo VietQR spec).

### 3. Deploy edge functions

```bash
supabase functions deploy payment-create
supabase functions deploy payment-manual-confirm
# Optional — chỉ deploy khi đã đăng ký Casso/Sepay:
supabase functions deploy payment-casso-webhook
supabase functions deploy payment-sepay-webhook
```

### 4. Set secrets

```bash
supabase secrets set CASSO_WEBHOOK_TOKEN=<your-casso-token>   # optional
supabase secrets set SEPAY_API_KEY=<your-sepay-key>           # optional
```

### 5. (Optional) Đăng ký webhook Casso

URL: `https://<project>.supabase.co/functions/v1/payment-casso-webhook`
Method: POST
Secure Token: `<value-CASSO_WEBHOOK_TOKEN>`

### 6. Frontend env

Đảm bảo Vercel đã set:

```
VITE_SUPABASE_URL=https://thdlyzafslwymzvnutfv.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

## Workflow xác nhận

### Auto (Casso/Sepay)

1. User CK từ app ngân hàng → ngân hàng forward cho Casso/Sepay trong vài giây
2. Casso/Sepay POST đến webhook của chúng ta
3. Webhook extract txn_ref từ description → match `payments.transfer_content`
4. So sánh amount (tolerance ±1 VND)
5. UPDATE status='completed'
6. Modal của user đang poll sẽ nhận được update trong lần poll tiếp theo (≤5s)

### Manual (fallback)

1. Leader mở `/leader/finance` → thấy row pending
2. Click "Duyệt" → POST đến `payment-manual-confirm`
3. Edge function check: admin/manager HOẶC leader của CLB đó
4. UPDATE status='completed', confirmed_by, confirmed_at

## Lưu ý quan trọng

- **Nội dung CK phải chính xác**: format `CLBXXXX` (4 ký tự A-Z2-9). Nếu user gõ sai → không match được → phải duyệt tay.
- **Bank description prefix**: Ngân hàng thường prefix nội dung CK (VD: `VCB - ` hoặc `MBVCB `). Code dùng regex `/CLB[A-Z0-9]{4}/i` nên match được dù có prefix.
- **Timeout poll**: Modal poll trong 5 phút. Sau đó hiện "Quá thời gian chờ, liên hệ CLB". Tránh spam.
- **VNPay cũ vẫn còn**: code VNPay (vnpay-payment, vnpay-ipn, bảng vnpay_transactions) KHÔNG bị xoá, chỉ không dùng nữa. Nếu muốn dọn, xoá thủ công sau khi verify flow mới ổn định.