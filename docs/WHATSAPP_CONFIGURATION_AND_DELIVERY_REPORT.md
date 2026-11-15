# WhatsApp Configuration & Delivery Report

## 1. Higher Authority Directory WhatsApp Controls
- **File:** `src/components/admin/communications/communications-hub.tsx`
- When `whatsappNumber` is absent: displays an explicit amber `Not Configured` badge and a visible `Configure WhatsApp` button opening the authority edit modal. Phone numbers are never used as clickable substitutes for configuration actions.
- When `whatsappNumber` is configured: displays the persisted number alongside `Edit`, `Test` (pre-fills the Real-Time Dispatch test console with the authority's WhatsApp number), and `Enable`/`Disable` buttons.
- **Persistence:** Updates persist to `HigherAuthorityRecipient` in PostgreSQL via `trpc.notifications.updateHigherAuthority` and `toggleHigherAuthorityStatus`. Verified in live E2E test (`919999888877` written, queried back, and restored).

## 2. Official Meta WhatsApp Cloud API Provider Configuration
- **Modal Component:** `src/components/admin/communications/whatsapp-provider-modal.tsx`
- **Service:** `src/server/services/whatsapp-business-config.service.ts` (`SystemSetting` key `whatsapp_business_config`, `isSecret: true`)
- **tRPC Router:** `src/server/trpc/routers/omnichannel.ts` (`getWhatsAppConnectionDetails`, `saveWhatsAppCredentials`, `verifyWhatsAppConnection`)
- **Security Fix Applied:** `saveWhatsAppCredentials` and `saveSalesGroupConfig` now enforce `["SUPER_ADMIN", "DIRECTOR", "ADMIN", "MANAGER"]` role checks and redact `accessToken` from the API response (`hasAccessToken: Boolean(_redacted)`).
- **Honest Provider Status:** Live production currently reports `total=20, emailsSent=15, whatsappSubmitted=0, simulated=5` (`SIMULATED` when Meta Cloud API token/Phone Number ID is not configured, without fake `CONNECTED` status).
