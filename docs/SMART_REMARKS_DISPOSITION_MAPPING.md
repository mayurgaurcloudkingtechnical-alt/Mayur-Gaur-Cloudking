# Smart Remarks & Disposition Mapping

**File:** `src/app/api/leads/smart-import/route.ts` (`mapRemarksToDisposition`)  
**Commit:** `e811fcb`

## Mapping Logic
- `"will visit soon"` / `"will visit"` / `"campus visit"` → `Interested / Visit Planned` (`qualityScore: HOT`)
- `"searching"` / `"looking for"` / `"classes"` → `Course Requirement Identified` (`qualityScore: HOT`)
- `"will think"` / `"think about"` → `Thinking / Follow-up Required` (`qualityScore: WARM`)
- `"didn't receive"` / `"not reachable"` / `"no answer"` → `Not Connected` (`qualityScore: WARM`)
- `"cut the call"` / `"disconnected"` → `Call Disconnected` (`qualityScore: COLD`)
- `"after X days"` → computes `nextFollowUp` (+X days)
- Original remarks are preserved verbatim in `notes` alongside the mapped disposition.

## Live Verification
- `"Will visit soon after 2 days"` → `disposition: "Interested / Visit Planned"`, `qualityScore: "HOT"`, `hasFollowUp: true`.
- `"Searching TGT & PGT classes"` → `disposition: "Course Requirement Identified"`, `qualityScore: "HOT"`.
