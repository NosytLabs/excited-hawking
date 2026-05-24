## Big-Bang Rewrite Ledger

| Removed path | Replacement path | Reason | Behavior impact |
| --- | --- | --- | --- |
| Repeated section wrappers in `src/App.tsx` | Shared `SectionBlock` wrapper in `src/App.tsx` | Remove duplicated layout/error-boundary/suspense scaffolding across secondary sections | No behavior change; same section order, ids, and lazy boundaries preserved |
| Duplicate stream status fields in `src/components/AgentStream.tsx` | Single canonical status line in `src/components/AgentStream.tsx` | Eliminate redundant stake/connection labels from mixed design eras | No data loss; stream still shows tier, stake, and connection state once |
| Hardcoded year assertion in `src/components/__tests__/AppHeader.test.tsx` | Runtime year assertion using `new Date().getFullYear()` | Prevent yearly brittle failure in header branding test | Test remains strict while avoiding calendar-based breakage |
