# Security Hardening And Dashboard Unification

## Objective

Close the confirmed production security gaps without interrupting the public
catalog, then replace the duplicated dashboard analytics surfaces with one
period-aware operational workspace.

## Phase 1 - Public API And Database Boundary

1. Add a dedicated public product mapper and tests proving private product
   fields never leave the public catalog API.
2. Separate the public mobile store response from the authenticated admin
   response so plan and usage data stay private.
3. Add checkout payload limits, normalization, dedicated rate limits and an
   idempotency key contract.
4. Harden session signature verification and reduce the global JSON body limit.
5. Add a Supabase migration that enables RLS on all public tables, revokes
   direct anon/authenticated table access and restricts privileged functions.

## Phase 2 - Unified Dashboard Contract

1. Add one authenticated `/api/dashboard/overview` endpoint that returns:
   current operational metrics, historical series, comparisons, rankings,
   quality alerts and recent activity.
2. Keep `/stats` and `/analytics` temporarily for backward compatibility while
   the frontend migrates to the overview endpoint.
3. Add contract tests for the unified response builder.

## Phase 3 - Dashboard Experience

1. Replace the separate historical and catalog metrics modules with a single
   analytics workspace using one category and period filter.
2. Use a light neutral canvas, restrained brand accents and depth shadows only
   on primary cards.
3. Reuse animated counters, stagger reveal and SVG path drawing while honoring
   reduced-motion preferences.
4. Keep operational "Agora" metrics visually distinct from historical values.

## Phase 4 - Verification And Release

1. Run backend tests, frontend focused tests, TypeScript lint, production builds
   and dependency audits.
2. Apply the database migration before deploying the backend.
3. Deploy backend and frontend.
4. Verify live RLS state, public API field redaction, checkout behavior,
   authenticated dashboard loading and public catalog health.
