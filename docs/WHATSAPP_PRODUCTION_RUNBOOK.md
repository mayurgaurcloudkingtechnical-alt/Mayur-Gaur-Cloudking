# WhatsApp Production Runbook — SoftLab Global

## 1. Securely Activating the System User Token (No Secrets in Chat/Git)
1. Log in as `SUPER_ADMIN` at `https://lms.softlabglobal.com/admin/communications`.
2. Click **Configure WhatsApp Provider**.
3. Enter:
   - **Meta App ID:** `1572356260711362`
   - **Meta Business Portfolio ID:** `2161320211099371`
   - **WABA ID:** `1071124442294607`
   - **System User Permanent Access Token:** Paste your `Conversions API System User` (`61595490181018`) token in the write-only password field.
4. Click **Save Configuration**.
5. Click **Test Live Connection**:
   - Validates token via `GET /v20.0/me`.
   - Automatically discovers the numeric **Phone Number ID** for `+91 91965 96975` from `GET /v20.0/1071124442294607/phone_numbers`.
   - Verifies webhook subscription via `GET /v20.0/1071124442294607/subscribed_apps`.
6. Click **Subscribe Webhook** if not yet subscribed, then test with **Send Test Message** to an authorized recipient.

## 2. Securing Webhook HMAC on VPS
Add `WHATSAPP_APP_SECRET=<Meta App Secret>` to `/var/www/softlab-global/.env` and run:
```bash
pm2 reload softlab-global --update-env
```
