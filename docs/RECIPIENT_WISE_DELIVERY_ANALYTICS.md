# Recipient-Wise Delivery Analytics Report

## 1. Analytics Metrics Implemented
- **Service:** `CentralNotificationEngine.getDeliveryStats()` in `src/server/services/central-notification-engine.service.ts`
- **UI Component:** `src/components/admin/communications/communications-analytics-bar.tsx`
- **12 Live KPIs:**
  1. Total Notifications (`20` verified live)
  2. Total Recipients (`13` unique `recipientAddress` values verified live)
  3. WhatsApp Submitted (`0` live)
  4. WhatsApp Delivered (`0` live)
  5. WhatsApp Read (`0` live)
  6. WhatsApp Failed (`0` live)
  7. Emails Sent (`15` live)
  8. Emails Delivered (`15` live)
  9. Emails Bounced (`0` live)
  10. Pending (`0` live)
  11. Retried (`0` live)
  12. Staged / Simulated (`5` live)

## 2. Filtering, Export & Printable Reporting
- **API Route:** `GET /api/communications/export` (`src/app/api/communications/export/route.ts`)
- **Supported Filters:** `dateFrom`, `dateTo`, `channel` (`WHATSAPP`, `OFFICIAL_EMAIL`, `PERSONAL_EMAIL`), `status` (`SENT`, `DELIVERED`, `READ`, `FAILED`, `SIMULATED`, `PENDING`), `eventType`, `department`, `search`.
- **Export Formats Verified Live:**
  - **CSV:** `HTTP 200`, `4,929` bytes with `Recipient Name, Role / Dept, Channel, Address / Phone, Event Type, Subject / Summary, Status, Retries, Sent At, Delivered At, Error`.
  - **Excel (`.xlsx` via `exceljs`):** `HTTP 200`, `8,107` bytes valid OOXML workbook (`PK` header).
  - **Print Report:** Browser print trigger (`window.print()`).
