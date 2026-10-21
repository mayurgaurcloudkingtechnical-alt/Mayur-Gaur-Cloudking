# SLG SKILLVERSE — Subdomain Deployment & DNS Configuration (Stage 2 Verified)

## Target Subdomain
`https://skillverse.softlabglobal.com`

## 1. Live DNS & Hosting Inspection (`Resolve-DnsName` Evidence)
Executed live DNS inspection against `softlabglobal.com`, `lms.softlabglobal.com`, and `skillverse.softlabglobal.com`:
- **DNS Registrar / Nameservers:** GoDaddy (`ns73.domaincontrol.com`, `ns74.domaincontrol.com`).
- **Root Domain (`softlabglobal.com`):** `A` record -> `76.76.21.21` (Vercel Edge Network).
- **Existing LMS Subdomain (`lms.softlabglobal.com`):** `CNAME` record -> `cname.vercel-dns.com` (`66.33.60.194`, `76.76.21.93`).
- **Target Subdomain (`skillverse.softlabglobal.com`):** Currently unprovisioned in GoDaddy DNS (`NXDOMAIN`).
- **Application Routing (`src/middleware.ts` + `nginx.conf`):**
  - `src/middleware.ts` inspects `req.headers.get("host")` and rewrites `skillverse.*` requests to `/skillverse/*` without affecting `softlabglobal.com`, `www.softlabglobal.com`, or `lms.softlabglobal.com`.

## 2. Exact External Actions Required (`PENDING EXTERNAL ACCESS`)
Do **not** modify root `@`, `www`, or `lms` DNS records. Perform **only** the following two additive steps:

### Step 1: Add Custom Domain in Vercel Project Settings
1. Open the SoftLab Global project in the **Vercel Dashboard** -> **Settings** -> **Domains**.
2. Click **Add** and enter:
   ```text
   skillverse.softlabglobal.com
   ```

### Step 2: Add `CNAME` Record in GoDaddy DNS (`ns73.domaincontrol.com` / `ns74.domaincontrol.com`)
Add the following record in GoDaddy DNS Management for `softlabglobal.com` (matching the existing `lms` subdomain pattern):
- **Type:** `CNAME`
- **Name / Host:** `skillverse`
- **Value / Points to:** `cname.vercel-dns.com`
- **TTL:** `1 Hour` (or Default)

*(Note: If deploying behind the standalone Nginx VPS instead of Vercel, point `skillverse` to the VPS IP and run `sudo certbot --nginx -d skillverse.softlabglobal.com && sudo systemctl reload nginx` as configured in `nginx.conf`.)*

## 3. Post-Deployment Verification Checklist
1. Verify DNS propagation: `Resolve-DnsName skillverse.softlabglobal.com`.
2. Check `https://skillverse.softlabglobal.com/api/skillverse/health` (expect HTTP 200 `"status": "HEALTHY"`).
3. Verify `https://skillverse.softlabglobal.com/` renders the SLG SKILLVERSE homepage over HTTPS.
4. Verify `https://www.softlabglobal.com/` and `https://lms.softlabglobal.com/` remain unchanged.
