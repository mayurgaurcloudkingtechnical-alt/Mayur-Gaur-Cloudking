# SLG SKILLVERSE — Safe Rollback Procedure

Because SLG SKILLVERSE is implemented as an isolated route group (`src/app/(skillverse)`), isolated tRPC router (`src/server/trpc/routers/skillverse.ts`), and isolated `SKILLVERSE_*` keys in `system_settings`, rolling back the application never affects existing SoftLab Global LMS, CRM, or website data.

## Steps to Roll Back Application Code
1. Revert the Skillverse commit on `main`:
   ```bash
   git revert <skillverse-commit-sha>
   git push origin main
   ```
2. Existing database records in `system_settings` under `category LIKE 'SKILLVERSE_%'` remain safely stored and inert without affecting any other table.
