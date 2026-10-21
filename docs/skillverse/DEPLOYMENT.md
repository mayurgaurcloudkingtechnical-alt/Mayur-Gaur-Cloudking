# SLG SKILLVERSE — Subdomain Deployment & DNS Configuration (Stage 2)

## Target Subdomain
`https://skillverse.softlabglobal.com`

## 1. Discovered Hosting & Proxy Architecture
- **`railway.json`**: Nixpacks builder running `npx prisma migrate deploy || true && npm run start`.
- **`nginx.conf`**: Multi-domain Nginx reverse proxy forwarding `softlabglobal.com`, `www.softlabglobal.com`, `lms.softlabglobal.com`, `api.softlabglobal.com`, and `skillverse.softlabglobal.com` to `http://127.0.0.1:3000`.
- **`src/middleware.ts`**: Host-aware Next.js middleware that inspects `req.headers.get("host")` and rewrites `skillverse.*` requests to `/skillverse/*` without touching root domain or LMS routing.

## 2. Exact External DNS & TLS Actions Required (`PENDING EXTERNAL ACCESS`)
Do **not** modify root `@` or `www` or `lms` DNS records. Add **only** the following additive record in your DNS registrar (Cloudflare / Hostinger / GoDaddy):

### Option A: If Deployed Behind the Nginx VPS (`nginx.conf`)
- **Record Type:** `A` (or `CNAME` pointing to `softlabglobal.com`)
- **Name / Host:** `skillverse`
- **Target:** Same IPv4 address as `lms.softlabglobal.com` (or `CNAME` -> `softlabglobal.com`)
- **TLS / HTTPS Certificate:** Run Certbot on the server to expand or issue the certificate:
  ```bash
  sudo certbot --nginx -d skillverse.softlabglobal.com
  sudo nginx -t && sudo systemctl reload nginx
  ```

### Option B: If Custom Domains Are Managed Directly in Railway / Vercel
1. Open the project settings in Railway / Vercel -> **Domains** -> **Add Custom Domain**.
2. Enter `skillverse.softlabglobal.com`.
3. Copy the exact CNAME target provided by the hosting dashboard and add a `CNAME` record for host `skillverse` in your DNS provider.

## 3. Post-Deployment Verification Checklist
1. Check `https://skillverse.softlabglobal.com/api/skillverse/health` (expect HTTP 200 `"status": "HEALTHY"`).
2. Verify `https://skillverse.softlabglobal.com/` renders the SLG SKILLVERSE homepage.
3. Verify `https://www.softlabglobal.com/` and `https://lms.softlabglobal.com/` remain unchanged.
