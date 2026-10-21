# SLG SKILLVERSE — Environment Variables Reference

> **Security Note:** Never commit secret values to source control. Configure these in `.env` or your hosting provider's secret manager.

| Variable Name | Required | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | Yes | PostgreSQL connection string used by Prisma |
| `DIRECT_URL` | Yes | Direct PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | Secret key for NextAuth session encryption |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Optional | Public Razorpay Key ID (falls back to explicit Sandbox mode if unconfigured) |
| `RAZORPAY_KEY_SECRET` | Optional | Server-only Razorpay Key Secret for order creation & HMAC-SHA256 verification |
| `RESEND_API_KEY` | Optional | Resend API key for transactional admission & receipt emails |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASSWORD` | Optional | SMTP fallback credentials for email delivery |
