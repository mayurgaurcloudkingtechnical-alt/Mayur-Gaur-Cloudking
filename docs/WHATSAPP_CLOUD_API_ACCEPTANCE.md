# WhatsApp Cloud API Acceptance Report

**Production URL:** `https://lms.softlabglobal.com`  
**Verification Date:** `2026-11-15`

## A. Code Implemented and Tested — `PASS`
- `WhatsAppBusinessConfigService` (`verifyMetaConnection`, `saveConfig`, `disconnect`, `subscribeWebhook`, numeric Phone Number ID discovery from `/{WABA_ID}/phone_numbers`).
- `WhatsAppProviderModal` (`Save Configuration`, `Test Live Connection`, `Subscribe Webhook`, `Send Test Message`, `Refresh`, `Disconnect`).
- `GET/POST /api/webhooks/whatsapp` (Meta challenge, `X-Hub-Signature-256` HMAC-SHA256, `wamid` idempotency, `NotificationDeliveryLog` & `OmnichannelMessage` persistence, media parsing).

## B. Production Configuration & API Verification — `PASS` / `BLOCKED`
| # | Check | Status | Evidence / Detail |
|---|---|---|---|
| 1 | Meta token validation | **BLOCKED** | `/me` returned `HTTP 401` (`OAuthException` code `190`, subcode `463`, expired `15-Nov-26 01:00:00 PST`). New System User token has not yet been entered in `.env` or UI modal. |
| 2 | Correct WABA identification | **PASS** | `1071124442294607` configured in `.env` & DB. |
| 3 | Correct Phone Number ID | **BLOCKED** | Stored value is `9196596975` (display number). Auto-discovery in `verifyMetaConnection()` will resolve the numeric ID once a valid token is saved. |
| 4 | Webhook challenge | **PASS** | `GET /api/webhooks/whatsapp?hub.mode=subscribe&...` returned `HTTP 200` with challenge string. |
| 5 | Webhook signature verification | **BLOCKED** | Code implemented; `WHATSAPP_APP_SECRET` is empty in VPS `.env`. |
| 6 | App subscription | **BLOCKED** | Requires non-expired System User token. |
| 7 | Outbound WhatsApp message | **BLOCKED** | Requires non-expired System User token & numeric Phone Number ID. |
| 8 | Inbound WhatsApp message | **BLOCKED** | Requires active Meta webhook subscription & valid token. |
| 9 | Delivery/read/failure callbacks | **BLOCKED** | Code implemented; awaits live Meta callback after token activation. |
| 10 | CRM contact association | **PASS** | `Enterprise Data Hub` (`76` leads, `12` students) & webhook `CrmIngestionService` verified. |
| 11 | Inbox persistence | **PASS** | `/admin/inbox` returned `HTTP 200`; `OmnichannelConversation`/`OmnichannelMessage` schema & queries verified. |
| 12 | RBAC verification | **PASS** | Unauthenticated `401`; `COUNSELOR` blocked (`403`) on `/api/enterprise-data`, allowed (`200`) on `/admin/communications`. |
| 13 | Production build | **PASS** | `next build` compiled `152/152` routes cleanly. |
| 14 | PM2 health check | **PASS** | `softlab-global`, `softlab-mail-api`, and `softlab-whatsapp` all `online`. |

## C. Live Message Sending and Receiving
- **Email (`Mailcow SMTP`):** `PASS` (`15` live emails `SENT` in `NotificationDeliveryLog`).
- **WhatsApp Cloud API:** `BLOCKED` until valid System User token is entered into `/admin/communications` → `Configure WhatsApp Provider`.

## D. External Meta Actions Still Pending
1. Enter the newly generated `Conversions API System User` (`61595490181018`) permanent token in `/admin/communications` → **Configure WhatsApp Provider** (never paste tokens in chat/Git).
2. Add `WHATSAPP_APP_SECRET` to `/var/www/softlab-global/.env` and reload PM2.
3. Click **Test Live Connection** (auto-discovers numeric Phone Number ID from WABA `1071124442294607`) and **Subscribe Webhook**.
4. Resolve any Meta Business Portfolio verification prompts in Meta Business Suite if Meta restricts outbound messaging until verification completes.

## E. WhatsApp Calling Eligibility / Status
- **Status:** **BLOCKED** (requires Meta Business Calling API eligibility, valid System User token, and approved phone number capability). Existing SIM/PSTN calling (`StaffCallLog`) remains unaffected.
