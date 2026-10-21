# SLG SKILLVERSE — Environment Variables Reference (Stage 2)

> **Security Note:** Never commit secret values to source control. Configure these in `.env` or your hosting provider's secret manager.

| Variable Name | Required | Status | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Yes | Configured | PostgreSQL connection string used by Prisma |
| `DIRECT_URL` | Yes | Configured | Direct PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | Configured | Secret key for NextAuth session encryption |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Optional | `PENDING EXTERNAL ACCESS` | Public Razorpay Key ID (falls back to explicit Sandbox mode if unconfigured) |
| `RAZORPAY_KEY_SECRET` | Optional | `PENDING EXTERNAL ACCESS` | Server-only Razorpay Key Secret for order creation & HMAC-SHA256 verification |
| `RAZORPAY_WEBHOOK_SECRET` | Optional | `PENDING EXTERNAL ACCESS` | Server-only Razorpay Webhook Secret for `/api/skillverse/payment/webhook` signature verification |
| `RESEND_API_KEY` | Optional | `PENDING EXTERNAL ACCESS` | Resend API key for transactional admission & receipt emails |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASSWORD` | Optional | `PENDING EXTERNAL ACCESS` | SMTP fallback credentials for email delivery |
