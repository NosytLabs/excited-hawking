# Project Operations

## Build Commands
npm run dev         # Development server
npm run build       # Production build
npm run preview     # Preview production build

## Validation
npm run test        # All tests (backend: 120+ tests)
npm run lint        # ESLint (1 warning remaining)
npm run typecheck   # TypeScript (npx tsc --noEmit)

## Backend Commands
cd backend && npm test     # Backend tests
cd backend && npm run dev  # Backend server

## Frontend Commands
npm run dev              # Frontend dev server
npm run build            # Frontend build

## Operational Notes
- Tests must pass before committing
- Typecheck failures block commits
- Lint: 1 warning (useMemo) is non-blocking but should fix
- Self-evolution tests were fixed (120 tests passing)