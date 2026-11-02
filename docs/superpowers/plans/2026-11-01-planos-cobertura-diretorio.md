# Planos, cobertura e diretório Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the secure product foundation for Free, Essencial and Profissional plans, geographic coverage, company galleries and public discovery.

**Architecture:** Centralize tier limits in a typed entitlement module and enforce them again in Postgres. Add an idempotent Supabase migration, official IBGE municipality selection, owner-managed coverage/categories/gallery, and a field-whitelisted public profile view. Keep the Asaas gateway in the dependent billing plan.

**Tech Stack:** Next.js 16.4.3 App Router, React 19, TypeScript 5, Supabase/Postgres, Node.js `node:test`, native `fetch`.

**Spec:** `docs/superpowers/specs/2026-11-01-planos-cobertura-asaas-design.md`

## Global Constraints

- Gratuito: 1 new active ad, 1 municipality, 1 segment, 3 subcategories, 0 additional profile photos.
- Essencial: R$ 39,90/month, 3 new active ads, 3 municipalities or national for digital/non-presential work, 2 segments, 6 subcategories, 3 additional photos.
- Profissional: R$ 59,90/month, 5 new active ads, 5 municipalities or national for digital/non-presential work, 3 segments, 10 subcategories, 10 additional photos.
- Existing active ads at migration are grandfathered and do not consume new-ad slots; inactive legacy ads are not grandfathered.
- Logo is available to every plan; one ad image is allowed in every plan; cover/gallery count toward additional profile-photo quota.
- Existing profile, listing, waitlist, and image data must be preserved; no production migration is run by the implementation.
- Public queries may expose only explicitly approved profile fields; private account email and WhatsApp are never public.
- Plan, subscription, verification, and grandfathering state are never client-writable.
- Use official IBGE municipality codes; national coverage requires a digital/non-presential declaration.
- No annual plan, Premium plan, video feature, fake listings, invented counts, unsupported highlights, analytics, or service-level promises.
- Do not add a dependency unless a required validation demonstrates it is missing.

## Review Focus

- A legacy account with many active ads must retain them as exempt, while only post-migration active ads consume its plan quota — test in Task 4.
- Concurrent listing and photo uploads must not exceed their post-migration quotas — test in Tasks 4 and 5.
- A legacy city that cannot be mapped unambiguously to IBGE must remain intact; an IBGE outage must show retry rather than accept free text — test in Task 3.
- Anonymous and authenticated non-owners must not retrieve private profile fields through either the base table or public view — test in Task 5.
- A downgrade must preserve data while removing excess new ads, areas, categories, and photos from public use — test in Tasks 2, 4, and 5.

---

### Task 1: Centralize plan entitlements

**Files:**
- Create: `src/lib/plans/entitlements.ts`
- Modify: `src/types/database.ts`
- Test: `tests/plan-entitlements.test.mjs`

**Interfaces:**
- Produces `PlanType = 'Gratuito' | 'Essencial' | 'Profissional'`.
- Produces `normalizeStoredPlanType(value: string): PlanType`; legacy `Premium` maps to Gratuito and unknown values throw.
- Produces `PlanEntitlements` and `getPlanEntitlements(plan: PlanType): PlanEntitlements`.
- `PlanEntitlements` contains exact fields: `maxNewActiveListings`, `maxMunicipalities`, `allowsNationalCoverage`, `maxSegments`, `maxSubcategories`, `maxProfilePhotos`, and `publicContacts`.
- Keep the generated database row type capable of reading legacy `Premium` until Task 7 removes its UI usage; it is not a selectable plan.

- [ ] **Step 1: Write failing entitlement tests**

  Assert each plan returns the exact limits in Global Constraints; assert legacy `Premium` normalizes to Gratuito; assert an unknown value is rejected rather than silently treated as paid.
- [ ] **Step 2: Run the targeted test**

  Run: `node --test tests/plan-entitlements.test.mjs`
  Expected: FAIL because the entitlement module is not implemented.
- [ ] **Step 3: Implement the typed entitlement module**

  Keep the values in one immutable map and use a strict legacy-normalization function. Remove `Premium` from any application-facing plan union without making existing database rows unrepresentable.
- [ ] **Step 4: Run the targeted test and type-check**

  Run: `node --test tests/plan-entitlements.test.mjs`
  Run: `npx tsc --noEmit`
  Expected: PASS.
- [ ] **Step 5: Commit**

  `feat: centraliza limites dos planos`

### Task 2: Add the relational schema, entitlements enforcement, and safe profile view

**Files:**
- Create: `supabase/schema_v4.sql`
- Modify: `src/types/database.ts`
- Create: `tests/schema-v4-static.test.mjs`
- Create: `supabase/tests/schema_v4.test.sql` if the repository's Supabase test environment supports pgTAP

**Interfaces:**
- Tables: `profile_service_areas`, `profile_categories`, `profile_subcategories`, `profile_gallery_images`, `subscriptions`, and `asaas_webhook_events`.
- `profile_service_areas` stores either one IBGE municipality or national scope, selection order, declaration, and `is_active`; a check constraint forbids municipality and national scope on the same row.
- `profile_categories` and `profile_subcategories` store normalized choices, selection order, and `is_active`; each subcategory references a selected profile category.
- `profile_gallery_images` stores `object_path`, `display_order`, upload status, and `is_active`.
- `subscriptions` stores `profile_id`, `plan_type`, nullable unique `asaas_subscription_id`, nullable `asaas_checkout_id`, unique `external_reference`, nullable customer ID and billing type until the provider event supplies them, application status, `current_period_end`, `grace_period_ends_at`, `cancel_at_period_end`, selected post-launch listing IDs, and timestamps; a partial unique index allows at most one pending/active/past-due subscription per profile.
- `asaas_webhook_events` stores a unique `event_key`, provider event type/resource ID, processing status, and received/processed timestamps; do not persist a full provider payload.
- Views: `profiles_public` and `listings_public`, deliberately owner-privilege, security-barrier projections with fixed allowlists; public profile contact columns are plan-gated, and public listing rows enforce the effective new-ad quota while exempting grandfathered ads.
- Listings receive a `grandfathered` marker set only for rows active when the migration runs.
- Database functions/triggers enforce plan limits atomically using the effective subscription state at the current time and protect plan, verification, and grandfathering fields from client writes. `PAST_DUE` remains paid only through `grace_period_ends_at`; canceled subscriptions remain paid only through `current_period_end`.
- `save_profile_coverage(p_service_areas jsonb, p_segments jsonb, p_declared_non_presential boolean): void` is an authenticated Postgres RPC that derives the profile ID from `auth.uid()` and replaces both relation sets atomically.
- `reserve_profile_gallery_slot(p_profile_id uuid, p_object_path text, p_display_order integer): uuid` checks the already-authenticated owner’s effective photo quota while locking the profile row, then inserts a pending gallery row; execution is granted only to `service_role`, and the server-side route supplies the profile ID after session verification.
- The `covers` Storage bucket is private; only the server-side admin client reads objects and creates short-lived signed URLs for active, in-quota media. The `avatars` bucket remains public for company logos.
- `apply_asaas_subscription_event(p_event_key text, p_event_type text, p_resource_id text, p_checkout_id text, p_asaas_subscription_id text, p_external_reference text, p_asaas_customer_id text, p_billing_type text, p_provider_status text, p_period_end timestamptz, p_event_at timestamptz) RETURNS TABLE (duplicate boolean, applied boolean)` is a service-role-only Postgres RPC that atomically claims the unique event key, rejects stale transitions, updates subscription/profile entitlements, and applies downgrade visibility without deleting user data.

- [ ] **Step 1: Write failing schema contract tests**

  Assert the migration defines every table/view above, makes the `covers` bucket private, removes broad public profile and waitlist policies, exposes fixed security-barrier views without private profile fields or `cover_url`, revokes default function execution, marks only currently active listings as grandfathered, protects plan fields, and is guarded for repeat application.
- [ ] **Step 2: Run the schema contract test**

  Run: `node --test tests/schema-v4-static.test.mjs`
  Expected: FAIL because the migration and contract test implementation are incomplete.
- [ ] **Step 3: Implement the additive, idempotent migration**

  Preserve legacy columns and data. Create normalized relations and foreign keys; keep `category_id` and `subcategory_id` synchronized to the primary choices. Add atomic listing/photo limit checks that lock the owner profile row before counting and compute effective plan from subscription status and current time, including the exact paid-through and three-day grace boundaries. Keep over-limit areas, categories, subcategories, and photos stored but inactive on downgrade; use the user’s selection/display order to determine which remain active within the destination entitlement. Count an existing cover in the photo quota without deleting its legacy URL. Make the existing `covers` bucket private without deleting objects; retain public logo access only in `avatars`. Implement the authenticated coverage RPC, service-role-only gallery reservation RPC, and service-role-only atomic webhook RPC with the exact signature above. These functions use `SECURITY INVOKER`, revoke default `PUBLIC` execution, and grant execution only to the intended role. The webhook RPC locates a pending subscription by checkout ID, provider subscription ID, or external reference and returns one result row. Remove public `SELECT` from `profiles` and `waitlist`; keep owner access to private profile rows and grant public reads only to the allowlisted owner-privilege views. Both views use fixed row predicates and `security_barrier = true`; `listings_public` applies grandfathering, destination-plan quota, and stored downgrade selection/recent-update fallback at query time. Revoke public waitlist inserts while retaining old rows.
- [ ] **Step 4: Verify the SQL**

  Run: `node --test tests/schema-v4-static.test.mjs`
  Run: `supabase test db` when the Supabase CLI and local database are already available.
  Expected: contract tests pass; SQL tests verify RLS, ownership, intended-only RPC execution, direct plan mutation rejection, current-active-ad grandfathering, quota enforcement, and paid/grace expiry boundaries. Do not install tooling or apply SQL to production.
- [ ] **Step 5: Commit**

  `feat: adiciona schema de planos e cobertura`

### Task 3: Provide official municipality lookup and legacy-safe location handling

**Files:**
- Create: `src/lib/geography/municipalities.ts`
- Create: `src/app/api/municipios/route.ts`
- Create: `src/components/geography/MunicipalitySelect.tsx`
- Test: `tests/municipalities.test.mjs`

**Interfaces:**
- `Municipality` contains `ibgeCode`, `name`, and `stateCode`.
- `searchMunicipalities(query: string): Promise<Municipality[]>` reads/caches the official IBGE municipality list on the server and filters locally.
- `GET /api/municipios?q=<text>` returns a bounded result list and a clear error response if the official source is unavailable.
- `MunicipalitySelect` emits a complete `Municipality`, never an unvalidated text string.

- [ ] **Step 1: Read the relevant Next.js 16 guide**

  Before implementing the route or caching, read the matching guide under `node_modules/next/dist/docs/` and follow its current route-handler/cache conventions.
- [ ] **Step 2: Write failing lookup/API tests**

  Test case-insensitive search, state/code preservation, bounded results, empty queries, malformed responses, and IBGE network failure without silently accepting free text.
- [ ] **Step 3: Run the targeted test**

  Run: `node --test tests/municipalities.test.mjs`
  Expected: FAIL before the lookup implementation exists.
- [ ] **Step 4: Implement the server lookup, route, and selector**

  Cache the non-personal municipality dataset server-side; do not send user data to IBGE. Provide a retryable UI error. Retain unmatched legacy `city/state` values until the owner selects a valid official municipality.
- [ ] **Step 5: Run the targeted test and lint**

  Run: `node --test tests/municipalities.test.mjs`
  Run: `npx eslint src/lib/geography/municipalities.ts src/app/api/municipios/route.ts src/components/geography/MunicipalitySelect.tsx`
  Expected: PASS.
- [ ] **Step 6: Commit**

  `feat: adiciona busca de municipios do IBGE`

### Task 4: Update registration, profile coverage, categories, and new-ad limits

**Files:**
- Modify: `src/components/auth/RegisterForm.tsx`
- Modify: `src/app/perfil/page.tsx`
- Modify: `src/app/anuncio/novo/page.tsx`
- Modify: `src/types/database.ts`
- Create: `src/lib/profiles/coverage.ts`
- Create: `src/lib/plans/listing-limits.ts`
- Test: `tests/profile-coverage.test.mjs`
- Test: `tests/listing-limits.test.mjs`

**Interfaces:**
- `CoverageSelection` is `{ scope: 'municipalities'; municipalities: Municipality[] } | { scope: 'national'; declaredNonPresential: boolean }`.
- `ValidationResult` is `{ valid: boolean; errors: string[] }`.
- `ProfileSegmentSelection` is `{ segments: Array<{ categoryId: string; subcategoryIds: string[]; isPrimary: boolean }> }`.
- `validateCoverageSelection(plan: PlanType, selection: CoverageSelection): ValidationResult` validates city count and national eligibility.
- `validateProfileSegments(plan: PlanType, selection: ProfileSegmentSelection): ValidationResult` validates segment/subcategory caps and relationships.
- `getCountableActiveListingCount(listings: Array<{ is_active: boolean; grandfathered: boolean }>): number` excludes grandfathered rows; `canCreateNewActiveListing(plan: PlanType, count: number): boolean` applies the tier cap. Database enforcement remains authoritative.
- `save_profile_coverage(p_service_areas jsonb, p_segments jsonb, p_declared_non_presential boolean): void` is an authenticated Postgres RPC that derives the profile ID from `auth.uid()` and replaces both relation sets atomically.

- [ ] **Step 1: Write failing registration/profile coverage tests**

  Assert free 1/1/3, Essential 3/2/6 and Professional 5/3/10 coverage/category limits; reject duplicate municipality codes, subcategories from a different segment, national coverage on Gratuito, and national scope without the non-presential declaration.
- [ ] **Step 2: Write failing listing-limit tests**

  Assert new active ads are limited to 1/3/5; grandfathered active rows do not consume slots; inactive legacy rows do consume a slot if reactivated after the migration; attempts to set `grandfathered` from a client are rejected.
- [ ] **Step 3: Run targeted tests**

  Run: `node --test tests/profile-coverage.test.mjs tests/listing-limits.test.mjs`
  Expected: FAIL before the validation and persistence logic exists.
- [ ] **Step 4: Implement the registration and profile flows**

  Default the first service area to the selected base municipality. Add multiple service-area/category/subcategory controls gated by plan entitlements. Save normalized relations through `save_profile_coverage` and maintain the legacy primary IDs. Surface Supabase validation failures instead of reporting success.
- [ ] **Step 5: Implement new-ad quota enforcement and UX**

  Display remaining new-ad slots and reject a new active listing when full. Keep SQL as the concurrency-safe authority; do not rely on disabled buttons or client-side counts.
- [ ] **Step 6: Run targeted tests, lint, and type-check**

  Run: `node --test tests/profile-coverage.test.mjs tests/listing-limits.test.mjs`
  Run: `npx eslint src/components/auth/RegisterForm.tsx src/app/perfil/page.tsx src/app/anuncio/novo/page.tsx src/lib/profiles/coverage.ts src/lib/plans/listing-limits.ts`
  Run: `npx tsc --noEmit`
  Expected: PASS.
- [ ] **Step 7: Commit**

  `feat: aplica limites de cobertura e anuncios`

### Task 5: Add the business photo gallery and downgrade-safe media visibility

**Files:**
- Create: `src/lib/supabase/admin.ts`
- Create: `src/app/api/profile/gallery/route.ts`
- Create: `src/components/profile/ProfileGallery.tsx`
- Create: `src/lib/profiles/gallery.ts`
- Modify: `.env.local.example`
- Modify: `src/app/perfil/page.tsx`
- Modify: `src/app/perfil/[id]/page.tsx`
- Modify: `src/types/database.ts`
- Test: `tests/profile-gallery.test.mjs`

**Interfaces:**
- `getGalleryLimit(plan: PlanType): number` returns 0, 3, or 10.
- `getPublicGallery(images: ProfileGalleryImage[], plan: PlanType, hasCover: boolean): ProfileGalleryImage[]` returns no more than the remaining plan quota after counting the cover and excludes inactive/hidden rows.
- `getSignedPublicGallery(profileId: string): Promise<Array<{ id: string; url: string; displayOrder: number }>>` first confirms the profile is publicly eligible, then uses the private admin client to return temporary URLs only for active photos plus an eligible cover; query/signing failures are surfaced.
- The logo (`avatar_url`) is separate; an existing cover and all additional business photos count toward the profile-photo quota.
- `GET /api/profile/gallery` authenticates the owner and returns temporary URLs for all preserved owner images, including over-quota inactive rows.
- `POST`, `PATCH`, and `DELETE /api/profile/gallery` authenticate the owner, validate image/quota/ownership, and use server-only storage access for upload, reorder/activation, and removal.

- [ ] **Step 1: Write failing gallery tests**

  Assert the 0/3/10 limits, logo excluded from the count, cover included, owner-only mutation, image validation, concurrent upload quota enforcement, and excess photos retained without a signed public URL after downgrade.
- [ ] **Step 2: Run the targeted test**

  Run: `node --test tests/profile-gallery.test.mjs`
  Expected: FAIL before gallery helpers exist.
- [ ] **Step 3: Implement storage and gallery management**

  Add a server-only Supabase admin client shared later with the billing plan. Keep the `covers` bucket private and disable direct client Storage access for it; the server creates short-lived signed URLs only for eligible media. Resolve legacy `cover_url` values only when they match this application's configured Supabase `covers` bucket; never sign arbitrary URLs. The upload route validates the authenticated owner, MIME type, size and quota, reserves a slot through `reserve_profile_gallery_slot`, uploads the object, and activates the reservation. The reservation RPC counts both existing `profiles.cover_url` and pending/active gallery rows while locking the owner profile. On upload failure, remove the reservation; on activation failure, remove both the object and reservation and surface the error. Route cover changes through the same quota enforcement; preserve existing cover data. Implement owner-only `GET`, `POST`, `PATCH`, and `DELETE` methods on `/api/profile/gallery` for listing preserved media, upload, reorder/activation, and removal. Do not leave an authenticated direct-upload path that bypasses quota checks.
- [ ] **Step 4: Implement profile gallery UI**

  Allow one logo in all plans; show up to 3 additional photos for Essencial and 10 for Profissional. Free users can see the plan limit and upgrade route, but cannot upload extra photos. Allow the owner to reorder/delete photos; the public profile returns only active photos within the effective plan limit.
- [ ] **Step 5: Run targeted tests, lint, and type-check**

  Run: `node --test tests/profile-gallery.test.mjs`
  Run: `npx eslint src/components/profile/ProfileGallery.tsx src/lib/profiles/gallery.ts src/app/perfil/page.tsx src/app/perfil/[id]/page.tsx`
  Run: `npx tsc --noEmit`
  Expected: PASS.
- [ ] **Step 6: Commit**

  `feat: adiciona galeria de fotos por plano`

### Task 6: Secure public profiles and create the company directory

**Files:**
- Create: `src/app/empresas/page.tsx`
- Modify: `src/app/perfil/[id]/page.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/categoria/[slug]/page.tsx`
- Modify: `src/app/anuncio/[id]/page.tsx`
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/mensagens/page.tsx`
- Modify: `src/app/api/leads/route.ts`
- Modify: `src/app/beneficios/page.tsx`
- Modify: `src/app/beneficios/BeneficiosFeed.tsx`
- Modify: `src/components/listings/ListingCard.tsx`
- Modify: `src/components/profile/ProfileCard.tsx`
- Test: `tests/public-profiles.test.mjs`

**Interfaces:**
- Public profile reads use `profiles_public`, and public listing reads use `listings_public`, never the base tables. The profile view omits `cover_url`; public profile pages retrieve eligible cover/gallery media through `getSignedPublicGallery`.
- Directory filters accept `ibgeCode`, `stateCode`, and `categoryId`; national providers are included in local search only with the “Atuação nacional” label.
- Public contact fields are null/omitted unless the effective plan is Essencial or Profissional.

- [ ] **Step 1: Write failing public-profile tests**

  Assert private login email and private WhatsApp never appear; public email/WhatsApp appear only for paid effective plans; unverified status remains independent of plan; national providers appear with the explicit label; local providers outside the queried municipality do not appear.
- [ ] **Step 2: Run the targeted test**

  Run: `node --test tests/public-profiles.test.mjs`
  Expected: FAIL while public reads still use broad profile access.
- [ ] **Step 3: Replace public profile reads**

  Read the allowlisted views and update list/profile/message joins to request only safe columns. Keep private base-table reads owner-only. Never expose `cover_url` from the profile view; render cover/gallery images only with temporary URLs produced by `getSignedPublicGallery`. Route every public listing search/detail query through `listings_public` so quota and grandfathering rules hold even after a grace period expires without a new webhook.
- [ ] **Step 4: Implement `/empresas` and landing discovery**

  Query real eligible profiles, add municipality/UF/segment filters, link each result to its profile, and show national scope distinctly. Empty data returns a real empty state and signup CTA; query failures show an explicit error/retry state, never a success-shaped empty result.
- [ ] **Step 5: Run public-profile tests and repository search**

  Run: `node --test tests/public-profiles.test.mjs`
  Run: `rg -n "from\\('profiles'\\)|profiles:[^\\n]*\\*" src/app src/components`
  Expected: remaining base-table queries are owner-only; public reads use the view or explicit safe query.
- [ ] **Step 6: Run lint and type-check**

  Run: `npx eslint src/app/empresas/page.tsx src/app/perfil/[id]/page.tsx src/app/page.tsx src/app/categoria/[slug]/page.tsx src/app/anuncio/[id]/page.tsx src/app/dashboard/page.tsx src/app/mensagens/page.tsx src/components/listings/ListingCard.tsx src/components/profile/ProfileCard.tsx`
  Run: `npx tsc --noEmit`
  Expected: PASS.
- [ ] **Step 7: Commit**

  `feat: adiciona diretorio publico seguro`

### Task 7: Publish accurate plan information and remove obsolete public flows

**Files:**
- Create: `src/app/planos/page.tsx`
- Modify: `src/components/landing/LandingPage.tsx`
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/layout/Footer.tsx`
- Modify: `src/app/cadastro/page.tsx`
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/beneficios/page.tsx`
- Modify: `src/app/beneficios/BeneficiosFeed.tsx`
- Modify: `src/app/beneficios/novo/page.tsx`
- Modify: `src/app/anuncio/[id]/page.tsx`
- Modify: `src/app/perfil/[id]/page.tsx`
- Modify: `src/app/api/waitlist/route.ts`
- Modify: `src/lib/email/resend.ts`
- Create: `src/lib/waitlist/disabled.ts`
- Modify: `src/lib/legal/legal-content.ts`
- Modify: `docs/superpowers/specs/2026-10-30-mega-update-ux-profile-waitlist-design.md`
- Modify: `docs/superpowers/specs/2026-11-01-resend-app-email-design.md`
- Delete: `src/lib/waitlist/handler.ts`
- Delete: `tests/waitlist-email.test.mjs`
- Create: `tests/waitlist-disabled.test.mjs`
- Modify: `tests/resend-email.test.mjs`
- Modify: `tests/legal-pages.test.mjs`
- Test: `tests/plan-pages.test.mjs`

- [ ] **Step 1: Write failing plan/content tests**

  Assert exact prices/limits, explanation that ad price is not platform price, verification independence, no annual/Premium/video/highlight/analytics promises, no fake company/count content, new waitlist requests return 410, and the legal contact is `faleconosco@descontododono.com.br`.
- [ ] **Step 2: Run the targeted tests**

  Run: `node --test tests/plan-pages.test.mjs tests/waitlist-disabled.test.mjs tests/resend-email.test.mjs`
  Expected: fail on the removed waitlist confirmation and stale public copy until updated.
- [ ] **Step 3: Implement the plan page and accurate upgrade paths**

  Show only Gratuit, Essencial, and Profissional with values from the entitlement module. Do not show a live checkout button until the dependent Asaas plan is complete; the combined release must link to the checkout flow.
- [ ] **Step 4: Remove obsolete/fictitious content**

  Remove public mock listings, mock benefits, unsupported growth counts, waitlist forms/links, video upload/embed/gallery/watch-time UI, and premium-style badges. Replace broad catches that convert database failures to mock/empty success with explicit error/retry states. Preserve old waitlist rows and legacy video columns. Make `POST` and `GET /api/waitlist` return explicit `410 Gone`; remove its public database insert/read policies.
- [ ] **Step 5: Preserve active Resend lead notifications**

  Remove only waitlist confirmation behavior and tests. Keep lead notification tests and use the single sender configuration `RESEND_FROM_EMAIL`; do not remove active lead notification behavior.
- [ ] **Step 6: Run the targeted tests and audit search**

  Run: `node --test tests/plan-pages.test.mjs tests/waitlist-disabled.test.mjs tests/resend-email.test.mjs`
  Run: `rg -ni "waitlist|lista de espera|video|assistir vídeo|tempo assistido|12\\.500\\+|48k\\+|2\\.800\\+" src`
  Expected: no public waitlist/video/fake-metric UI; only the explicit decommissioned API and preserved migration references may remain.
- [ ] **Step 7: Run lint and type-check**

  Run: `npx eslint src/app/planos/page.tsx src/components/landing/LandingPage.tsx src/components/layout/Header.tsx src/components/layout/Footer.tsx src/app/cadastro/page.tsx src/app/login/page.tsx src/app/dashboard/page.tsx src/app/beneficios/page.tsx src/app/beneficios/BeneficiosFeed.tsx src/app/beneficios/novo/page.tsx src/app/anuncio/[id]/page.tsx src/app/perfil/[id]/page.tsx src/app/api/waitlist/route.ts src/lib/email/resend.ts src/lib/legal/legal-content.ts`
  Run: `npx tsc --noEmit`
  Expected: PASS.
- [ ] **Step 8: Commit**

  `feat: publica planos e encerra lista de espera`

### Task 8: Run the Fase 1 regression gate

**Files:**
- Verify all files from Tasks 1–7; modify only failures introduced by this work.

- [ ] **Step 1: Run repository lint**

  Run: `npm run lint`
  Expected: PASS without new warnings or errors.
- [ ] **Step 2: Run type-check**

  Run: `npx tsc --noEmit`
  Expected: PASS.
- [ ] **Step 3: Run production build**

  Run: `npm run build`
  Expected: PASS.
- [ ] **Step 4: Start the production server**

  Run `npm run start -- --port 3108` in an attached background session.
  Expected: production server starts and responds on port 3108.
- [ ] **Step 5: Run all Node tests against the ready server**

  Run: `LEGAL_TEST_ORIGIN=http://127.0.0.1:3108 node --test tests/*.test.mjs`
  Expected: PASS, including `tests/legal-pages.test.mjs`. Stop the server after the test run.
- [ ] **Step 6: Review SQL, RLS, public projection, and data-preservation criteria**

  Confirm no production migration was run, no legacy rows were deleted, and the SQL test limitation (if local Supabase is unavailable) is reported clearly.
- [ ] **Step 7: Commit**

  `test: valida fundacao de planos e diretorio`

## Execution order and dependency

Complete Tasks 1–7 in order. Task 2 creates the subscription tables consumed by
the Asaas plan. The Asaas implementation plan
`docs/superpowers/plans/2026-11-01-integracao-asaas.md` starts only after Tasks
1–7 pass. Run Task 8 after both plans are complete to validate the combined
release.
