# Changelog

## 2026-05-24

### Cleanup
- Removed stale spec/plan docs for superseded experiments (warm-shell-audit, audit-fixes, audit-remediation, pre-refactor commons-agent plans)
- Removed unused assets (hero.png, react.svg, vite.svg)
- Untracked runtime memvid.json files and added to .gitignore

### Build Status
- All tests: PASS (138 frontend, 120 backend)
- Lint: PASS
- TypeScript: PASS
- Vite build: PASS

## 2026-05-23

### Cleanup
- Removed redundant audit files (AUDIT.md, SECURITY_AUDIT.md, COMPREHENSIVE_AUDIT_2026.md, FULL_AUDIT.md)
- Fixed duplicate `addLog` in AgentContext.tsx
- Fixed Guestbook.tsx missing `useCallback` import
- Updated index.html title to "The Commons Agent"

### Build Status
- TypeScript check: PASS
- Vite build: PASS (306KB JS, 2KB CSS)