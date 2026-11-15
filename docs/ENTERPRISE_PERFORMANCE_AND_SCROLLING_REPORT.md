# Enterprise Performance & Scrolling Report

## 1. Root Cause of Horizontal Clipping & Cut-off Tables
- **File:** `src/components/common/dashboard-shell.tsx`
- Inside the flex container `<div className="flex flex-1">`, `<main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">` lacked `min-w-0`. In CSS Flexbox, a flex child defaults to `min-width: auto`, allowing wide child tables (`min-w-[920px]`) to expand `<main>` beyond the viewport instead of triggering inner `overflow-x-auto` scrollbars.

## 2. Fix Applied
- Added `min-w-0` to both `<div className="flex flex-1 min-w-0">` and `<main className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8">`.
- All wide data tables in `CommunicationsHub` (`min-w-[920px]`) and `EnterpriseDataHub` (`min-w-[980px]`) are wrapped in `overflow-x-auto` containers so horizontal scrollbars appear cleanly without clipping or breaking sidebar/page layout.

## 3. Server-Side Pagination & Query Performance
- `/api/enterprise-data` and `CentralNotificationEngine.listDeliveryLogs` enforce server-side pagination (`limit` capped at `100` / `200`, `skip`/`take`, and `Promise.all` parallel count + page queries) to prevent large-payload timeouts.
