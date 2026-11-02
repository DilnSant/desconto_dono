# Resend App Email Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send waitlist confirmations and benefit-owner lead notifications through Resend without exposing credentials or losing database records when delivery fails.

**Architecture:** Keep Supabase Auth on its existing Resend SMTP configuration. Use a shared server-only Resend service in Next.js for app emails, with a waitlist route adapter and a new lead route that derives its recipient from the benefit owner's public profile.

**Tech Stack:** Next.js 16.4.3 Route Handlers, TypeScript, Supabase SSR client, Resend Node.js SDK, Node.js built-in test runner.

**Spec:** [2026-11-01-resend-app-email-design.md](../specs/2026-11-01-resend-app-email-design.md)

## Global Constraints

- Use `faleconosco@descontododono.com.br` as the sender for app emails.
- Read `RESEND_API_KEY` and `RESEND_FROM_EMAIL` only in server code.
- The Vercel integration has already added `RESEND_API_KEY`; `RESEND_FROM_EMAIL` has also been added manually by the user.
- Keep Supabase Auth SMTP settings in Supabase; the Vercel sender variable does not configure Auth.
- Send lead notices only to the benefit owner's database-derived `profiles.email_public`; never use a private Auth email or a recipient supplied by the browser.
- A post-insert email failure must not undo a waitlist registration or lead.
- Use stable Resend idempotency keys derived from the persisted row IDs.
- Do not add schema or RLS changes for this email integration, and do not use a service-role key.
- Do not log email addresses, names, WhatsApp numbers, API keys, or message contents.

## Review Focus

- Missing `RESEND_API_KEY` or `RESEND_FROM_EMAIL` must leave persisted records successful and report delivery failure; cover in the email-service and route tests.
- Resend provider rejection after a waitlist insert must not encourage duplicate signup; cover in the waitlist handler test.
- Unknown or inactive benefit IDs must not create leads or trigger email; cover in the lead service test.
- Missing public business email must save the lead and skip sending; cover in the lead service test.
- Invalid lead payloads and Supabase lookup/insert errors must not be reported as successful lead capture; cover in the lead service test.

---

### Task 1: Add the server-only Resend email service

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.env.local.example`
- Create: `src/lib/email/resend.ts`
- Test: `tests/resend-email.test.mjs`

**Interfaces:**
- Produces `EmailDeliveryResult` as `{ sent: true } | { sent: false; reason: 'not_configured' | 'provider_error' }`.
- Produces `createResendEmailService(options: { apiKey?: string; from?: string; clientFactory?: (apiKey: string) => Pick<Resend, 'emails'> })` with `sendWaitlistConfirmation(input)` and `sendLeadNotification(input)`.
- `sendWaitlistConfirmation` accepts `{ id, fullName, email, city, state }`.
- `sendLeadNotification` accepts `{ id, recipient, benefitTitle, clientName, clientWhatsapp }`.
- The confirmation subject is `Cadastro recebido com sucesso`; the lead subject is `Novo lead para: {benefitTitle}`.
- Both methods send Portuguese `text` and `html` content. Escape interpolated user/business values in HTML. Their idempotency keys are `waitlist-confirmation/{id}` and `lead-notification/{id}` respectively.

- [ ] **Step 1: Write failing unit tests**

Test a successful confirmation and lead email with a fake Resend client; assert sender `Desconto do Dono <faleconosco@descontododono.com.br>`, the expected recipient, exact subject, idempotency key, and HTML escaping of interpolated user/business values. Test missing API key/sender and provider rejection return `sent: false` without throwing or logging message PII. Assert the module has no `NEXT_PUBLIC_` configuration and is imported only by server-side modules.

- [ ] **Step 2: Run the tests and verify failure**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/resend-email.test.mjs`
Expected: FAIL because the service does not exist.

- [ ] **Step 3: Add the pinned Resend SDK dependency**

Run: `npm install --save-exact resend`
Expected: `package.json` records an exact version and `package-lock.json` is updated.

- [ ] **Step 4: Implement the server-only email service**

Create the SDK client lazily from `RESEND_API_KEY`; read `RESEND_FROM_EMAIL` from the server environment. Inject a fake client through the factory options for tests. Return a failed delivery result for missing configuration or provider errors, and log only a non-PII diagnostic.

- [ ] **Step 5: Document the local sender variable and run unit tests**

Add `RESEND_FROM_EMAIL=faleconosco@descontododono.com.br` to `.env.local.example` without adding any secret. Run `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/resend-email.test.mjs`; expected: PASS with no network calls.

- [ ] **Step 6: Commit the task**

```bash
git add package.json package-lock.json .env.local.example src/lib/email/resend.ts tests/resend-email.test.mjs
git commit -m "feat: adiciona serviço de email do Resend"
```

### Task 2: Send waitlist confirmation after registration

**Files:**
- Modify: `src/app/api/waitlist/route.ts`
- Modify: `src/components/landing/LandingPage.tsx`
- Create: `src/lib/waitlist/handler.ts`
- Test: `tests/waitlist-email.test.mjs`

**Interfaces:**
- `createWaitlistPostHandler(dependencies)` returns a `(request: Request) => Promise<Response>` handler.
- Its dependencies are `createId(): string`, `insert(input: { id: string; full_name: string; email: string; city: string; state: string; category_id: string | null; has_company: boolean; accepted_terms: true }): Promise<{ errorCode?: string }>`, `getCityPosition(city, state): Promise<number | null>`, and `sendConfirmation(input): Promise<EmailDeliveryResult>`.
- The route adapter supplies those operations using `getServerDb()` and `sendWaitlistConfirmation`.
- Generate the row UUID before INSERT and do not chain `.select()` onto the write. Map unique violation `23505` to HTTP 409 without a public pre-query.
- Calculate position only from the aggregate `cities_ranking` view. If that lookup fails after insertion, return registration success with `position: null` and an explanatory `notice`.
- A successful POST retains the existing registration fields and adds `emailSent: boolean` to the response, using HTTP 200 as today. Duplicate email returns HTTP 409; invalid input returns HTTP 400; database insert failure returns HTTP 500.

- [ ] **Step 1: Write failing handler tests**

Use fake repository and mailer dependencies to test a successful insert and send, a successful insert followed by provider failure or missing mail configuration, a unique-constraint conflict with no send, database insertion failure with no send, and ranking failure after insert. Assert failed delivery still returns HTTP 200, a successful registration, and `emailSent: false`; duplicate email returns 409 and never attempts mail; ranking failure returns success with `position: null` and a notice.

- [ ] **Step 2: Run the tests and verify failure**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/waitlist-email.test.mjs`
Expected: FAIL because the injectable handler does not exist.

- [ ] **Step 3: Implement the injectable waitlist handler and route adapter**

Move POST orchestration into `src/lib/waitlist/handler.ts`; normalize the email before INSERT, generate a UUID before the write, and map `23505` to 409 without querying waitlist PII. Send only after a new insert succeeds. Query the public aggregate `cities_ranking` view for position; a query failure must not undo the saved registration or suppress its confirmation. Keep the existing GET ranking behavior unchanged.

- [ ] **Step 4: Update waitlist success messaging**

Read `emailSent` and optional `notice` from the API response. Continue showing registration success if email delivery fails, but state that the confirmation email could not be sent; do not claim delivery. Show the ranking notice when position could not be calculated.

- [ ] **Step 5: Run waitlist tests and lint the changed files**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/waitlist-email.test.mjs`
Expected: PASS.

Run: `npx eslint src/app/api/waitlist/route.ts src/components/landing/LandingPage.tsx src/lib/waitlist/handler.ts src/lib/email/resend.ts tests/waitlist-email.test.mjs`
Expected: PASS.

- [ ] **Step 6: Commit the task**

```bash
git add src/app/api/waitlist/route.ts src/components/landing/LandingPage.tsx src/lib/waitlist/handler.ts tests/waitlist-email.test.mjs
git commit -m "feat: envia confirmação da lista de espera"
```

### Task 3: Notify benefit owners when a lead is captured

**Files:**
- Create: `src/app/api/leads/route.ts`
- Create: `src/lib/leads/create-lead.ts`
- Modify: `src/components/ui/LeadCaptureModal.tsx`
- Test: `tests/lead-notification.test.mjs`

**Interfaces:**
- `createLead(input, dependencies)` accepts `{ offerId, clientName, clientWhatsapp }`.
- Dependencies expose `findActiveBenefit(offerId): Promise<{ id: string; title: string; authorId: string } | null>`, `findPublicEmail(authorId): Promise<string | null>`, `insertLead(input: { id: string; offerId: string; clientName: string; clientWhatsapp: string }): Promise<void>`, `sendNotification(input): Promise<EmailDeliveryResult>`, and `createId(): string`.
- Success returns `{ success: true; leadId: string; emailStatus: 'sent' | 'skipped_no_public_email' | 'failed' }`; validation, missing/inactive benefit, and database failures return `{ success: false; status: 400 | 404 | 500; error: string }`.
- The route adapts Supabase `benefits`, `profiles`, and `leads` queries to these dependencies using `getServerDb()`.

- [ ] **Step 1: Write failing lead-service tests**

Test invalid payload (HTTP 400), unknown/inactive benefit (HTTP 404), Supabase lookup/insert errors (HTTP 500), successful insert and notification, missing public email, and provider rejection after insert. Assert no email is attempted for invalid benefits or missing recipient, and provider rejection does not undo the saved lead.

- [ ] **Step 2: Run the tests and verify failure**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/lead-notification.test.mjs`
Expected: FAIL because the lead service does not exist.

- [ ] **Step 3: Implement lead validation and orchestration**

Validate trimmed name, a WhatsApp number containing 10 or 11 digits, and a non-empty benefit ID. Reject a missing/inactive benefit before insertion. After insertion, skip sending when `email_public` is null; otherwise send through `sendLeadNotification` and return the explicit email status.

- [ ] **Step 4: Add the server route and replace the browser-side insert**

Implement `POST /api/leads` using the existing server-side Supabase client, with no service-role credential. Query `benefits` by ID and `is_active = true`, select `id,title,author_id`, derive its `author_id`, then query `profiles` by that ID and select only `email_public`; finally insert the lead into `leads`. Generate the lead UUID before insertion and include it in the insert, so the route does not need a follow-up SELECT to create the idempotency key. Return HTTP 201 once the lead is persisted, including `emailStatus`; a mail failure must not change the 201 to an error. Map invalid payload to 400, an unknown/inactive benefit to 404, and Supabase lookup or insert errors to 500. Update `LeadCaptureModal` to call the route and render truthful messaging for sent, skipped, and failed email statuses. Preserve anonymous lead capture.

- [ ] **Step 5: Run lead tests and lint the changed files**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/lead-notification.test.mjs`
Expected: PASS.

Run: `npx eslint src/app/api/leads/route.ts src/lib/leads/create-lead.ts src/components/ui/LeadCaptureModal.tsx src/lib/email/resend.ts tests/lead-notification.test.mjs`
Expected: PASS.

- [ ] **Step 6: Commit the task**

```bash
git add src/app/api/leads/route.ts src/lib/leads/create-lead.ts src/components/ui/LeadCaptureModal.tsx tests/lead-notification.test.mjs
git commit -m "feat: notifica empresas sobre novos leads"
```

### Task 4: Verify the integrated email flows

**Files:**
- Test: `tests/resend-email.test.mjs`
- Test: `tests/waitlist-email.test.mjs`
- Test: `tests/lead-notification.test.mjs`

- [ ] **Step 1: Run all targeted email tests**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/resend-email.test.mjs tests/waitlist-email.test.mjs tests/lead-notification.test.mjs`
Expected: PASS without production Resend or Supabase credentials.

- [ ] **Step 2: Run TypeScript, lint, and production build checks**

Run: `npx tsc --noEmit`
Expected: PASS.

Run: `npm run lint`
Expected: PASS.

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Verify deployment configuration**

Confirm `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are available to the intended Vercel environments, then redeploy. Do not print or copy the API key into source files.

- [ ] **Step 4: Perform manual delivery checks**

After deployment, test Supabase password recovery, a waitlist signup, a lead for a business with `email_public`, and a lead for a business without `email_public`. Confirm records persist when a notification is skipped or fails.
