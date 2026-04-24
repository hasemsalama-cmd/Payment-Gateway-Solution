# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/api-server run seed` — reset & seed lending portal demo data

## Lending Portal

A small-business loan management app with three artifacts:

- `artifacts/lending-portal` — React+Vite frontend (public apply/status flow + admin workspace)
- `artifacts/api-server` — Express API
- `lib/db` — Drizzle schema (`loan_applications`, `loans`, `loan_payments`, `scoring_rules`)

### Features
- Public: landing page, loan application with live affordability check, status lookup by reference code (`LP-XXXXXXXX`)
- Admin: dashboard (metrics, monthly volume, risk distribution), application review (approve/deny/disburse), loan management (amortization schedule, payment recording), scoring rules settings with live simulator
- Internal scoring engine (0–100) computes recommendation (approve/review/deny), suggested interest rate, DTI, and PTI ratios. Defaults: approve ≥70, review ≥50, max DTI 0.40, max PTI 0.35, base rate 8.5%, risk premium 2.5%/band.

### Conventions
- Numeric DB columns are stored as strings (Drizzle `numeric`); use `serializers.ts` to convert before sending JSON.
- Date columns: timestamps → ISO; `date` columns → `YYYY-MM-DD`.
- All shared types & validators come from generated `@workspace/api-zod` and `@workspace/api-client-react`.
- Frontend formatters live in `artifacts/lending-portal/src/lib/utils.ts` (`formatCurrency`, `formatPercent`, `cn`).
- No auth in the first build (single-tenant demo). Admin pages are open at `/admin/*`.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
