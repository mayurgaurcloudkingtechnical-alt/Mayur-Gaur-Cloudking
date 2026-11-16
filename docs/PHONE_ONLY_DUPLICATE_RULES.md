# Phone-Only Duplicate Detection Rules

**Files:** `src/app/api/leads/smart-import/route.ts`, `src/app/api/enterprise-data/route.ts`  
**Commit:** `e811fcb`

## Implemented Rules
1. Mobile numbers are normalized to 10-digit Indian numbers (`/^[6-9]\d{9}$/`, stripping `+91`, `91`, `0`, spaces, brackets, hyphens).
2. Duplicate checking queries `db.lead.findFirst({ where: { phone } })` **only** — never name, email, city, course, or remarks.
3. Within-upload duplicates are tracked via `seenPhones` `Set<string>` and marked `DUPLICATE`.
4. Invalid/missing numbers are marked `NEEDS_REVIEW` without overwriting existing CRM records.

## Live Test Evidence
- Same name (`Same Name Test`), different phones (`9821511933`, `9721511933`) → **both imported (`ON_HOLD`)**.
- Different name (`Different Name Dup`), same phone (`9821511933`) → **`DUPLICATE`**.
- Invalid phone (`12345`) → **`NEEDS_REVIEW`**.
