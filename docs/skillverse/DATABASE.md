# SLG SKILLVERSE — Database Namespace & Backup Guide

## 1. Zero-Migration Namespace Strategy
To guarantee zero risk of data loss or schema locks on the live production PostgreSQL database, SLG SKILLVERSE persists all records inside the indexed `system_settings` table (`model SystemSetting`) using dedicated `category` namespaces:
- `SKILLVERSE_CONFIG` — Course catalogue, academic packages, competitive add-ons, fee rules, batches, FAQs, blogs, and CMS settings.
- `SKILLVERSE_ENQUIRY` — 11-stage admissions CRM records (`SV_ENQ_SV-ADM-YYYY-XXXX`).
- `SKILLVERSE_STUDENT` — Enrolled student profiles, attendance logs, assignments, PTM schedules, and SHA-256 hashed parent PINs (`SV_STU_SV-STU-YYYY-XXX`).
- `SKILLVERSE_INVOICE` — Itemized fee invoices, Razorpay order IDs, and verified receipt numbers (`SV_INV_SV-INV-YYYY-XXXX`).
- `SKILLVERSE_CERTIFICATE` — Verifiable completion certificates (`SV_CERT_SLG-SV-CERT-YYYY-XXXX`).
- `SKILLVERSE_ASSESSMENT` — Diagnostic assessment attempts & subject scorecards.
- `SKILLVERSE_NOTIFICATION` — Email & WhatsApp notification delivery audit queue.
- `SKILLVERSE_ANALYTICS` — Privacy-safe conversion events (zero PII).
- `SKILLVERSE_AUDIT` — Security and administrative action audit trail.

## 2. Backup & Export Query
```sql
SELECT key, category, value, "updatedAt"
FROM system_settings
WHERE category LIKE 'SKILLVERSE_%';
```
