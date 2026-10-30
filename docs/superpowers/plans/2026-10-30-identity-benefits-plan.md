# Identity and Benefits UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the official domain, improve header/footer branding, and make benefit examples and in-person locations behave correctly.

**Architecture:** Keep the existing Next.js App Router structure. Update metadata and OAuth/reset callbacks to fixed production URLs; keep header/footer presentation in their current components; add optional location fields to the existing `benefits` flow. The SQL contract begins in `supabase/schema_v4.sql`; later plans append their own additive statements to that same file and must run after this plan.

**Tech Stack:** Next.js 16.4.3, React 19, TypeScript, Tailwind CSS 4, Supabase JS, Node.js `node:test`.

**Spec:** [2026-10-30-mega-update-ux-profile-waitlist-design.md](../specs/2026-10-30-mega-update-ux-profile-waitlist-design.md)

## Global Constraints

- Official canonical origin and every Supabase `redirectTo`: `https://www.descontododono.com.br`.
- Header subtitle: “Vantagens reais. Negócios locais.”
- Footer description: “Conectamos empreendedores de direita para fortalecer negócios locais e transformar boas parcerias em contratos confiáveis. Nossa plataforma aproxima quem produz, gera empregos e movimenta a economia brasileira”.
- Benefit location columns: `location_city` and `location_state`, both nullable.
- Only fictional benefits are disabled; real database benefits remain redeemable.
- Preserve unrelated worktree changes and stage only files in this delivery.

## Review Focus

- OAuth must not fall back to `window.location.origin`; test the absolute production callback.
- An unread count of zero or a failed count query must not display a badge; test the count-to-badge condition.
- The long footer copy must wrap without forcing the logo out of alignment; inspect at mobile and desktop widths.
- Fictional items must not open the redemption modal, while real items remain enabled; test both branches.
- Empty optional city/state values must persist as `null`, not empty strings; test the location normalizer.

---

### Task 1: Fix canonical metadata and Supabase redirect URLs

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/components/auth/LoginForm.tsx`
- Modify: `src/app/recuperar-senha/page.tsx`
- Create: `tests/official-domain.test.mjs`

**Interfaces:**
- Consumes: the existing metadata export and Supabase OAuth/reset calls.
- Produces: both Auth flows use absolute callbacks on the official origin.

- [ ] **Step 1: Write the failing contract test**

Create `tests/official-domain.test.mjs` with `node:test` and `node:assert/strict`. Read the three source files and assert that:
  - layout metadata contains `new URL('https://www.descontododono.com.br')`;
  - OAuth uses `https://www.descontododono.com.br/auth/callback`;
  - password recovery uses `https://www.descontododono.com.br/atualizar-senha`;
  - neither Auth redirect uses `window.location.origin`.

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --test tests/official-domain.test.mjs`
Expected: FAIL because OAuth still uses the browser origin.

- [ ] **Step 3: Update the canonical and callback URLs**

Keep the canonical metadata URL fixed to the official origin and replace the OAuth redirect with the absolute callback. Preserve the existing absolute recovery URL.

- [ ] **Step 4: Run the test**

Run: `node --test tests/official-domain.test.mjs`
Expected: PASS.

### Task 2: Improve the header, footer, and message badge

**Files:**
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/layout/Footer.tsx`
- Create: `src/lib/messages/unread-count.ts`
- Create: `tests/header-footer-contract.test.mjs`
- Create: `tests/unread-count.test.mjs`
- Modify: `src/app/layout.tsx` only if prop wiring is needed

**Interfaces:**
- Consumes: authenticated `user` prop and the existing Supabase browser client.
- Produces: `getUnreadCount(client: SupabaseClient<Database>, userId: string): Promise<number | null>` and a responsive brand lockup. Return `null` after logging a query error so unknown is distinct from a real zero.

- [ ] **Step 1: Write failing tests**

In `tests/header-footer-contract.test.mjs`, assert the header source contains the exact title, subtitle, and “Gratuito”; assert the footer source contains the exact institutional text; assert no hardcoded red badge count remains. In `tests/unread-count.test.mjs`, stub a Supabase-like query result and assert `getUnreadCount` returns the unread count, zero when no rows are counted, and `null` after a query error. The helper filters `receiver_id = userId` and `is_read = false` and uses an exact head count.

- [ ] **Step 2: Run the tests and verify failure**

Run: `node --test tests/header-footer-contract.test.mjs tests/unread-count.test.mjs`
Expected: FAIL because the title lockup, real count, and count helper do not exist.

- [ ] **Step 3: Implement the visual changes and real count**

Increase image height from `h-10 sm:h-12` to approximately `h-13 sm:h-16`. Put the image and a `min-w-0` title/subtitle stack in the home link. Add a smaller “Gratuito” element to the desktop announce CTA and its mobile equivalent. Query unread messages with `receiver_id = userId` and `is_read = false`; render the badge only for a positive numeric result. On query errors, log the error and return `null` so the badge remains hidden. Change the footer description block to a responsive `flex flex-row items-center gap-6` layout with the full approved copy beside the logo.

- [ ] **Step 4: Run tests and inspect responsive layout**

Run: `node --test tests/header-footer-contract.test.mjs tests/unread-count.test.mjs`
Expected: PASS. Start the production build and inspect the header/footer at 375px and 1440px widths; text wraps without horizontal overflow and the logo remains aligned.

### Task 3: Add benefit location and disable fictional redemptions

**Files:**
- Create or modify: `supabase/schema_v4.sql`
- Modify: `src/types/database.ts`
- Modify: `src/app/beneficios/page.tsx`
- Modify: `src/app/beneficios/BeneficiosFeed.tsx`
- Modify: `src/app/beneficios/novo/page.tsx`
- Create: `src/lib/benefits/location.ts`
- Create: `tests/benefit-location.test.mjs`
- Create: `tests/benefit-ui-contract.test.mjs`

**Interfaces:**
- Consumes: current `benefits` table, `MOCK_BENEFITS`, and insert flow.
- Produces: optional `location_city`/`location_state` values and an optional `is_example` marker for local mocks.
- SQL ownership: append benefit location statements to `supabase/schema_v4.sql`; the profile and waitlist plans append their sections later.

- [ ] **Step 1: Write failing tests**

Test `normalizeBenefitLocation(city, state): { location_city: string | null; location_state: string | null }` for whitespace trimming, empty input, and UF uppercasing. Assert the feed has an example-only disabled branch and the mock dataset marks all six fictional records as examples.

- [ ] **Step 2: Run tests and verify failure**

Run: `node --experimental-strip-types --test tests/benefit-location.test.mjs tests/benefit-ui-contract.test.mjs`
Expected: FAIL because the normalizer and example marker are not implemented.

- [ ] **Step 3: Add schema, types, form fields, and feed behavior**

Add nullable `location_city TEXT` and `location_state TEXT` columns with `ADD COLUMN IF NOT EXISTS`. Extend `Database.benefits.Row`, `Insert`, and `Update`. Add optional “Cidade” and “Estado” inputs to the benefit form and persist the normalized values. Add location fields to `BenefitItem`, render a location only when present, and mark the six mock entries with `is_example: true`. Set `disabled` and reduced opacity only when `is_example` is true; keep real benefits clickable.

- [ ] **Step 4: Run tests and validate types**

Run: `node --experimental-strip-types --test tests/benefit-location.test.mjs tests/benefit-ui-contract.test.mjs`
Expected: PASS.
Run: `npx tsc --noEmit`
Expected: exit code 0.

### Task 4: Verify the identity and benefits workstream

- [ ] **Step 1: Run targeted lint**

Run: `npx eslint src/app/layout.tsx src/app/beneficios/page.tsx src/app/beneficios/BeneficiosFeed.tsx src/app/beneficios/novo/page.tsx src/components/auth/LoginForm.tsx src/components/layout/Header.tsx src/components/layout/Footer.tsx src/types/database.ts src/lib/messages/unread-count.ts src/lib/benefits/location.ts tests`
Expected: no lint errors in changed files.

- [ ] **Step 2: Review the SQL and diff**

Run: `git diff --check` and inspect `supabase/schema_v4.sql`.
Expected: additive, repeatable statements; no destructive DDL or unrelated file changes.
