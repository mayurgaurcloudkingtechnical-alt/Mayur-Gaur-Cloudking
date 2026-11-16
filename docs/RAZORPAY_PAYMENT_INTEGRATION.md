# Razorpay Payment Integration Report

**Files:** `src/server/services/online-payment.service.ts`, `src/app/api/verify-payment/route.ts`, `src/app/api/webhooks/razorpay/route.ts`  
**Commit:** `e811fcb`

## Security Fix & Verification
- Removed hardcoded fallback secret `"nk890Xco6v1UayrJBKsgabs1"` from `src/app/api/verify-payment/route.ts`; now strictly requires `process.env.RAZORPAY_KEY_SECRET || env.RAZORPAY_KEY_SECRET` and uses `crypto.timingSafeEqual`.
- VPS `.env` has `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` configured.
- **Live Fail-Closed Tests (`PASS`):**
  - `POST /api/verify-payment` with `order_sim_123` → `HTTP 400` (`"Simulated or unverified payment bypasses are not permitted."`)
  - `POST /api/verify-payment` with invalid 64-hex signature → `HTTP 400` (`"Invalid payment signature. Payment verification failed."`)
