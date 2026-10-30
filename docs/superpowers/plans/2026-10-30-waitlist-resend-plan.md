# Waitlist and Resend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make waitlist registration reliable, protect personal data under RLS, and send an automatic Resend confirmation without losing a successful database registration when email delivery fails.

**Architecture:** Validate and normalize the request in a pure helper; insert through the existing server-side Supabase client without a follow-up SELECT; use the aggregate city view for ranking; send email only after a new insert. The landing form presents database, ranking, and email outcomes separately. Append the RLS statements to the shared `supabase/schema_v4.sql` after the identity/benefits and profile plans.

**Tech Stack:** Next.js 16.4.3 Route Handler, Supabase JS, Resend Node.js SDK, Node.js built-in test runner.

**Spec:** [2026-10-30-mega-update-ux-profile-waitlist-design.md](../specs/2026-10-30-mega-update-ux-profile-waitlist-design.md)

## Global Constraints

- Keep public INSERT only for accepted waitlist submissions; remove public SELECT from `public.waitlist`.
- Do not expose or log submitted email/name in diagnostics.
- Generate the row UUID before INSERT and omit `.select()` from the write.
- A successful insert remains successful if ranking or email delivery subsequently fails.
- Duplicate e-mail returns HTTP `409`; malformed request returns HTTP `400`.
- Email configuration: `RESEND_API_KEY` and `WAITLIST_FROM_EMAIL`; sender domain must be verified by Resend.
- Never hardcode provider credentials or expose secrets in `NEXT_PUBLIC_*`.
- Preserve existing local worktree changes; stage only task files.

## Review Focus

- Malformed JSON, non-object payloads, and oversized fields must return controlled `400` responses; test each input class.
- A filled honeypot must not insert or send e-mail; test this branch.
- Unique-constraint conflicts must return `409` without sending a second e-mail; test error mapping.
- Missing Resend configuration or provider rejection after INSERT must preserve registration and return `emailSent: false`; test both.
- Ranking query failure after INSERT must not return a false registration failure; test nullable position and explicit notice.

---

### Task 1: Implement and test waitlist request validation

**Files:**
- Create: `src/lib/waitlist/validation.ts`
- Create: `tests/waitlist-validation.test.mjs`

**Interfaces:**
- Produces:
  - `WaitlistInput`;
  - `validateWaitlistPayload(input: unknown): { ok: true; value: WaitlistInput } | { ok: false; error: string }`.
- Accepted input fields: `full_name`, `email`, `city`, `state`, optional `category_id`, optional `has_company`, required `accepted_terms`, and honeypot `website`.

- [ ] **Step 1: Write failing tests**

Test valid payload normalization (trim name/city, lowercase email, uppercase UF); reject missing fields, invalid email, UF not exactly two letters, incorrect field types, oversized strings, terms not accepted, and a non-empty `website` honeypot.

- [ ] **Step 2: Run tests and verify failure**

Run: `node --experimental-strip-types --test tests/waitlist-validation.test.mjs`
Expected: FAIL because the validator does not exist.

- [ ] **Step 3: Implement the validator**

Validate `unknown` before property access. Return only normalized known fields; do not pass arbitrary request properties to Supabase.

- [ ] **Step 4: Run tests**

Run: `node --experimental-strip-types --test tests/waitlist-validation.test.mjs`
Expected: PASS.

### Task 2: Add and test the Resend confirmation helper

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/lib/email/waitlist-confirmation.ts`
- Create: `tests/waitlist-confirmation.test.mjs`

**Interfaces:**
- Produces: `sendWaitlistConfirmation(input: WaitlistConfirmation): Promise<{ sent: boolean; error?: string }>` where input contains `id`, `fullName`, `email`, `city`, and `state`.

- [ ] **Step 1: Write failing tests**

Test success, missing environment variables, and provider error. Assert the message subject is “Cadastro recebido com sucesso”, the recipient is the submitted e-mail, and the idempotency key is unique to the waitlist row ID.

- [ ] **Step 2: Run tests and verify failure**

Run: `node --experimental-strip-types --test tests/waitlist-confirmation.test.mjs`
Expected: FAIL because the confirmation helper does not exist.

- [ ] **Step 3: Install and pin the Resend SDK**

Use npm to add `resend` as an exact dependency and retain the generated lockfile. Do not install Nodemailer or expose the API key to the client.

- [ ] **Step 4: Implement the Portuguese confirmation email**

Read `RESEND_API_KEY` and `WAITLIST_FROM_EMAIL` only on the server. Send a concise HTML and text confirmation using the SDK and an idempotency key derived from the row UUID. Return `{ sent: false, error }` for missing configuration or provider errors so the route can preserve the registration.

- [ ] **Step 5: Run tests without real credentials**

Run: `node --experimental-strip-types --test tests/waitlist-confirmation.test.mjs`
Expected: PASS using a mocked fetcher/client; no request reaches Resend.

### Task 3: Secure waitlist SQL and implement the route

**Files:**
- Modify: `supabase/schema_v4.sql`
- Modify: `src/types/database.ts` if the response or waitlist fields require a type update
- Modify: `src/app/api/waitlist/route.ts`
- Create: `tests/waitlist-route-contract.test.mjs`

**Interfaces:**
- Consumes: validator and confirmation helper from Tasks 1–2 and existing `getServerDb()`.
- Produces: `POST` response `{ success: true, id, position: number | null, emailSent: boolean, notice?: string }`.

- [ ] **Step 1: Write failing contract tests**

Assert SQL drops `waitlist_public_read`, revokes table SELECT from `anon`/`authenticated`, grants INSERT, creates an INSERT policy requiring `accepted_terms`, and grants SELECT only on the aggregate `cities_ranking` view. Assert the route inserts without `.select()`, maps database code `23505` to `409`, and attempts mail only after successful insertion.

- [ ] **Step 2: Run the test and verify failure**

Run: `node --test tests/waitlist-route-contract.test.mjs`
Expected: FAIL because the RLS hardening and route behavior are not implemented.

- [ ] **Step 3: Append idempotent waitlist policy statements**

Drop the broad SELECT policy and revoke direct SELECT. Drop the existing `waitlist_public_insert` policy before recreating it for `anon` and `authenticated` with `accepted_terms = true`. Grant the roles INSERT on `waitlist` and SELECT on the aggregate `cities_ranking` view. Keep only aggregate ranking data publicly readable. Do not use a `SECURITY DEFINER` function.

- [ ] **Step 4: Implement POST**

Reject invalid JSON and validator failures with `400`. Generate `crypto.randomUUID()` before INSERT and insert that ID with normalized values, without `.select()`. Map unique violation `23505` to `409`. For other database errors, log a structured error without user PII and return `500`. After a successful insert, query only the matching `cities_ranking` aggregate; on failure, leave `position` null and provide a notice. Call the Resend helper only for a newly inserted row and set `emailSent` from its result. Return `201` with distinct registration and e-mail status.

- [ ] **Step 5: Make GET failures explicit**

Return ranking data on success. On Supabase error, log a diagnostic and return `500`; do not return an empty success-shaped fallback.

- [ ] **Step 6: Run the tests**

Run: `node --test tests/waitlist-route-contract.test.mjs`
Expected: PASS.

### Task 4: Update the landing form for waitlist outcomes

**Files:**
- Modify: `src/components/landing/LandingPage.tsx`
- Create: `tests/waitlist-form-contract.test.mjs`

**Interfaces:**
- Consumes: the POST response from Task 3.
- Produces: a hidden honeypot field and distinct confirmation messaging for registration, email, and position outcomes.

- [ ] **Step 1: Write the failing form contract test**

Assert the request includes the honeypot field; success UI distinguishes `emailSent: true` from `false`; missing position does not display a fabricated queue number; server errors remain visible in the form.

- [ ] **Step 2: Run the test and verify failure**

Run: `node --test tests/waitlist-form-contract.test.mjs`
Expected: FAIL because the response handling currently assumes only `success` and `position`.

- [ ] **Step 3: Implement the honeypot and state messaging**

Add a visually hidden honeypot input with `aria-hidden`, `tabIndex={-1}`, and autocomplete disabled; include it in the request. Preserve the successful signup state when the API confirms `success`; show the email-delivery notice when `emailSent` is false and suppress the position widget when `position` is null.

- [ ] **Step 4: Run the test**

Run: `node --test tests/waitlist-form-contract.test.mjs`
Expected: PASS.

### Task 5: Verify the waitlist workstream and delivery configuration

- [ ] **Step 1: Run all waitlist tests**

Run: `node --experimental-strip-types --test tests/waitlist-*.test.mjs`
Expected: PASS without Supabase or Resend credentials.

- [ ] **Step 2: Run lint and type checking**

Run: `npx eslint src/app/api/waitlist/route.ts src/components/landing/LandingPage.tsx src/lib/waitlist/validation.ts src/lib/email/waitlist-confirmation.ts src/types/database.ts tests`
Expected: no lint errors in changed files.
Run: `npx tsc --noEmit`
Expected: exit code 0.

- [ ] **Step 3: Review SQL and production configuration**

Run: `git diff --check` and inspect the waitlist section of `supabase/schema_v4.sql`.
Expected: no direct public SELECT on `waitlist`; only the aggregate ranking remains exposed. Record that production must set `RESEND_API_KEY` and a verified `WAITLIST_FROM_EMAIL`.

### Task 6: Final verification and requested delivery

- [ ] **Step 1: Run the full required validation**

Run: `npm run lint`, `npx tsc --noEmit`, `npm run build`, and all `node:test` suites.
Expected: all checks pass.

- [ ] **Step 2: Review scope and SQL instructions**

Run: `git status --short --branch`, `git diff --check`, and inspect the complete staged diff. Preserve the pre-existing deleted/untracked assets; stage only this feature and its tests.

- [ ] **Step 3: Commit the implementation**

Use the exact requested subject:

```bash
git commit -m "feat: mega update de layout, perfil multiplo, lista de espera e correcoes"
```

- [ ] **Step 4: Push and verify**

Run `git push origin main`, fetch `origin`, and verify `HEAD` equals `origin/main`. Report the full commit hash, checks, SQL that must be applied, and the Resend environment variables that must be configured.
