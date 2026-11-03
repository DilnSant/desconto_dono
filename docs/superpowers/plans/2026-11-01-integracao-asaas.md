# Asaas Subscription Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let authenticated companies contract Essencial or Profissional through hosted Asaas checkout, activate benefits only after confirmed payment, and keep subscription state synchronized safely.

**Architecture:** Use the shared plan entitlements and subscription tables from the foundation plan. A server-only Asaas adapter creates hosted monthly checkouts, while an authenticated and idempotent webhook processor updates subscriptions through an administrative Supabase client. The UI never grants its own plan.

**Tech Stack:** Next.js 16.4.3 App Router, React 19, TypeScript 5, Supabase/Postgres, native `fetch`, Node.js `node:test`.

**Spec:** `docs/superpowers/specs/2026-11-01-planos-cobertura-asaas-design.md`

**Dependency:** Complete and validate `docs/superpowers/plans/2026-11-01-planos-cobertura-diretorio.md` first.

## Global Constraints

- Essencial costs R$ 39,90/month; Profissional costs R$ 59,90/month; no annual billing.
- A checkout redirect never activates a plan; only a validated confirmed-payment event does.
- The browser never receives `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN`, or `SUPABASE_SERVICE_ROLE_KEY`.
- Webhook processing is authenticated, idempotent, replay-safe, and safe for duplicate/out-of-order events.
- Cancellation stops future charges and preserves benefits through the paid period; overdue invoices have a three-day grace period.
- Hosted monthly recurring checkout supports credit card; Pix and boleto are not supported for this Asaas recurring Checkout flow.
- Entitlements are evaluated against the current time on every server/database gate: a paid cancellation remains active through `current_period_end`, and a past-due subscription remains active only through `grace_period_ends_at`; a delayed webhook cannot extend access.
- After downgrade, preserve user data; public/active entitlements follow the destination plan and the grandfathered-ad rule in the spec.
- Credentials stay server-only and are never logged or pasted into conversation.
- Do not call production Asaas or alter production Supabase during tests.

## Review Focus

- Tampered checkout requests cannot choose their own price, customer, or plan — test in Task 2.
- A forged webhook or wrong shared token cannot activate a subscription — test in Task 3.
- Duplicate and out-of-order webhook events cannot duplicate activation or roll back a newer state — test in Task 3.
- Cancellation and overdue status preserve the exact paid-through/grace dates and apply downgrade once — test in Task 3.
- A confirmed late payment reactivates the correct plan without re-enabling excess ads/photos beyond entitlement rules — test in Task 3.

---

### Task 1: Build a server-only Asaas API adapter

**Files:**
- Create: `src/lib/billing/asaas-client.ts`
- Test: `tests/asaas-client.test.mjs`

**Interfaces:**
- `createAsaasClient(config: AsaasConfig): AsaasClient`.
- `AsaasConfig = { apiKey: string; environment: 'sandbox' | 'production'; fetchImpl?: typeof fetch }`.
- `BillingType = 'CREDIT_CARD'` for recurring Checkout.
- `AsaasCheckoutInput` contains the paid plan and fixed amount in centavos, credit card (`billingTypes: ['CREDIT_CARD']`), `chargeTypes: ['RECURRENT']`, `subscription: { cycle: 'MONTHLY' }`, one server-priced item conforming to the current required checkout schema, callback URLs, and the local external reference. Customer data is supplied only when supported/required by the current official checkout documentation; otherwise the hosted checkout collects it. The adapter converts centavos to the provider’s currency value.
- `CheckoutSession = { checkoutId: string; checkoutUrl: string }`, normalized from the provider response `id` and `link`; do not assume checkout creation returns a subscription ID.
- `AsaasClient.createCheckout(input: AsaasCheckoutInput): Promise<CheckoutSession>`.
- `AsaasClient.getCheckout(checkoutId: string): Promise<AsaasCheckout>`.
- `AsaasClient.getPayment(paymentId: string): Promise<AsaasPayment>`.
- `AsaasClient.getSubscription(subscriptionId: string): Promise<AsaasSubscription>`.
- `AsaasClient.cancelSubscription(subscriptionId: string): Promise<void>`.
- Normalize provider checkout, payment, and subscription DTOs in this module. `AsaasCheckout = { id: string; status: 'ACTIVE' | 'CANCELED' | 'EXPIRED' | 'PAID'; externalReference: string | null; customerId: string | null; nextDueDate: string | null }`; payment/subscription DTOs include identifiers, status, billing type, external reference, and provider dates required by the state machine.
- All provider input/output types are defined in this module and contain no credentials.

- [ ] **Step 1: Read current Next.js and Asaas documentation**

  Read the applicable route-handler/server-only guides in `node_modules/next/dist/docs/` and verify current official Asaas hosted-checkout, recurring-payment, authentication, and webhook payload requirements. Do not rely on older API assumptions.
- [ ] **Step 2: Write failing adapter tests**

  Assert sandbox/production base URL selection, server auth header, exact monthly recurring checkout payload with card, Pix rejected for recurrence, provider error propagation, malformed responses, and that credentials never enter request bodies or logs.
- [ ] **Step 3: Run the targeted test**

  Run: `node --test tests/asaas-client.test.mjs`
  Expected: FAIL before the adapter exists.
- [ ] **Step 4: Implement the adapter with native `fetch`**

  Validate configuration before requests. Keep provider DTOs separate from application types. Parse provider errors into explicit typed failures; do not return success-shaped fallbacks.
- [ ] **Step 5: Run the targeted test and lint**

  Run: `node --test tests/asaas-client.test.mjs`
  Run: `npx eslint src/lib/billing/asaas-client.ts`
  Expected: PASS.
- [ ] **Step 6: Commit**

  `feat: adiciona cliente server-side do Asaas`

### Task 2: Create authenticated hosted checkout

**Files:**
- Create: `src/lib/billing/create-checkout.ts`
- Create: `src/app/api/billing/checkout/route.ts`
- Test: `tests/billing-checkout.test.mjs`

**Interfaces:**
- `PaidPlan = 'Essencial' | 'Profissional'`.
- `createCheckout(input: { profileId: string; plan: PaidPlan }, deps: { repository: BillingRepository; asaas: AsaasClient; returnUrl: string }): Promise<{ checkoutUrl: string }>`; the repository persists a pending subscription/reference.
- `BillingRepository` exposes `hasOpenSubscription(profileId: string): Promise<boolean>`, `createPendingSubscription(input: { profileId: string; plan: PaidPlan; externalReference: string }): Promise<void>`, `attachCheckout(input: { externalReference: string; checkoutId: string }): Promise<void>`, and `markCheckoutFailed(externalReference: string): Promise<void>`.
- `POST /api/billing/checkout` accepts only `{ plan: 'Essencial' | 'Profissional' }`; profile identity comes from the authenticated Supabase session.
- The service creates the pending subscription record, starts checkout, persists the provider checkout ID, and returns only the hosted checkout URL. `asaas_subscription_id`, customer ID, and billing type stay nullable until verified provider events supply them.

- [ ] **Step 1: Write failing checkout-service and route tests**

  Assert unauthenticated requests fail, invalid plan fails, client-supplied price/profile/customer IDs are ignored, the server sends the correct monthly recurring price with card, and a pending checkout does not set the profile plan.
- [ ] **Step 2: Run the targeted test**

  Run: `node --test tests/billing-checkout.test.mjs`
  Expected: FAIL before the service and route exist.
- [ ] **Step 3: Reuse the server-only Supabase admin client**

  Consume `src/lib/supabase/admin.ts` from the foundation plan. Validate `SUPABASE_SERVICE_ROLE_KEY` and prevent imports from client components. Keep normal user authorization on the request client; use admin access only for privileged subscription writes.
- [ ] **Step 4: Implement the checkout service and route**

  Derive profile ID from the authenticated Supabase user; use fixed prices R$ 39,90 and R$ 59,90 from server constants; configure the hosted checkout for monthly card recurrence; reject a second pending/active subscription; create the pending local row and external reference before checkout; then persist the provider checkout ID. If provider checkout creation fails, mark the local row failed. If persisting the provider response fails, return an explicit error and keep the pending row correlatable by its external reference so a later webhook can reconcile it; do not claim success or create another checkout on retry while the record is unresolved. Do not treat the browser return URL as payment confirmation.
- [ ] **Step 5: Run tests, lint, and type-check**

  Run: `node --test tests/billing-checkout.test.mjs`
  Run: `npx eslint src/lib/supabase/admin.ts src/lib/billing/create-checkout.ts src/app/api/billing/checkout/route.ts`
  Run: `npx tsc --noEmit`
  Expected: PASS.
- [ ] **Step 6: Commit**

  `feat: cria checkout mensal do Asaas`

### Task 3: Process webhooks and subscription state transitions

**Files:**
- Create: `src/lib/billing/subscription-state.ts`
- Create: `src/lib/billing/process-webhook.ts`
- Create: `src/app/api/billing/webhook/route.ts`
- Modify: `src/lib/plans/entitlements.ts`
- Consume: `apply_asaas_subscription_event(...)` from `supabase/schema_v4.sql`
- Test: `tests/asaas-webhook.test.mjs`

**Interfaces:**
- `SubscriptionSnapshot = { planType: PaidPlan; status: 'PENDING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'INACTIVE'; currentPeriodEnd: string | null; gracePeriodEndsAt: string | null }`.
- `getEffectivePlan(subscription: SubscriptionSnapshot | null, now: Date): PlanType`; pending/inactive returns Gratuito, active/canceled retains the paid plan only while `now < currentPeriodEnd`, and past due retains it only while `now < gracePeriodEndsAt`.
- `NormalizedAsaasEvent = { eventKey: string; eventType: string; resourceId: string; checkoutId: string | null; asaasSubscriptionId: string | null; externalReference: string | null; asaasCustomerId: string | null; billingType: BillingType | null; occurredAt: string }`; `eventKey` is the provider event ID; the route adapter maps current official checkout, payment, and subscription payloads to this shape.
- `VerifiedAsaasEvent = { eventKey: string; eventType: string; resourceId: string; checkoutId: string | null; asaasSubscriptionId: string | null; externalReference: string | null; asaasCustomerId: string | null; billingType: BillingType | null; providerStatus: string; periodEnd: string | null; occurredAt: string }`.
- `WebhookDependencies = { asaas: AsaasClient; applyVerifiedEvent(input: VerifiedAsaasEvent): Promise<{ duplicate: boolean; applied: boolean }>; now(): Date }`.
- `processAsaasWebhook(event: NormalizedAsaasEvent, deps: WebhookDependencies): Promise<WebhookProcessResult>`.
- `deriveSubscriptionState(current: SubscriptionState, verifiedResource: AsaasCheckout | AsaasPayment | AsaasSubscription, now: Date): SubscriptionTransition`.
- The event ledger uses a unique provider event/resource key and stores event type, processing result, and timestamps without retaining full PII payloads.
- The SQL RPC `apply_asaas_subscription_event(p_event_key text, p_event_type text, p_resource_id text, p_checkout_id text, p_asaas_subscription_id text, p_external_reference text, p_asaas_customer_id text, p_billing_type text, p_provider_status text, p_period_end timestamptz, p_event_at timestamptz) RETURNS TABLE (duplicate boolean, applied boolean)` is called through the server-only Supabase admin client after provider verification; the TypeScript wrapper normalizes its single result row to `{ duplicate: boolean; applied: boolean }`.

- [ ] **Step 1: Write failing state-transition tests**

  Cover authenticated `CHECKOUT_PAID` activation only after the API confirms checkout status `PAID`, recurring `PAYMENT_CONFIRMED`/`PAYMENT_RECEIVED`, pending/overdue status, duplicate event, out-of-order older event, cancellation through paid-through date, three-day grace, exact `currentPeriodEnd`/`gracePeriodEndsAt` expiry boundaries through `getEffectivePlan`, grace expiry downgrade, and late confirmed payment reactivation.
- [ ] **Step 2: Write failing webhook-route tests**

  Assert missing/wrong token returns unauthorized; `CHECKOUT_PAID` activates only when the fetched checkout is currently `PAID`; recurring payment events require matching Asaas payment/subscription state; unknown events are acknowledged safely without changing entitlements; database failure returns a retryable server error.
- [ ] **Step 3: Run targeted tests**

  Run: `node --test tests/asaas-webhook.test.mjs`
  Expected: FAIL before the processor and route exist.
- [ ] **Step 4: Implement pure transition logic**

  Keep dates in UTC and make transitions deterministic through an injected clock. Implement `getEffectivePlan` with strict `now < endDate` boundaries and use the same semantics in the SQL enforcement/view logic. A confirmed event must match the pending subscription/customer before the profile plan changes.
- [ ] **Step 5: Implement the authenticated route and atomic persistence**

  Compare the `asaas-access-token` shared webhook token in constant time; verify checkout/payment/subscription resources through the Asaas adapter (`CHECKOUT_PAID` requires a current `PAID` checkout); claim/record the event idempotently; update subscription state and effective profile plan transactionally. Treat unknown events as acknowledged no-ops after authentication. Do not log full webhook payloads or credentials.
- [ ] **Step 6: Run tests and type-check**

  Run: `node --test tests/asaas-webhook.test.mjs`
  Run: `npx eslint src/lib/billing/subscription-state.ts src/lib/billing/process-webhook.ts src/app/api/billing/webhook/route.ts`
  Run: `npx tsc --noEmit`
  Expected: PASS.
- [ ] **Step 7: Commit**

  `feat: sincroniza assinaturas pelo webhook Asaas`

### Task 4: Add subscription management and connect the plans page

**Files:**
- Modify: `src/app/planos/page.tsx`
- Create: `src/app/assinatura/page.tsx`
- Create: `src/app/api/billing/cancel/route.ts`
- Create: `src/lib/billing/cancel-subscription.ts`
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/perfil/page.tsx`
- Modify: `src/app/anuncio/novo/page.tsx`
- Modify: `src/components/layout/Header.tsx`
- Test: `tests/billing-cancel.test.mjs`
- Test: `tests/subscription-ui.test.mjs`

- [ ] **Step 1: Write failing UI contract tests**

  Assert the correct plan price and limits, checkout starts only after explicit plan selection, hosted checkout offers monthly credit card recurrence, a pending subscription displays as pending/Gratuito, cancellation describes the paid-through date, and UI never grants a plan from a return query parameter. In `tests/billing-cancel.test.mjs`, assert unauthenticated/foreign-profile cancellation fails, provider failure leaves local access unchanged, and repeated cancellation is idempotent.
- [ ] **Step 2: Run the targeted test**

  Run: `node --test tests/subscription-ui.test.mjs`
  Expected: FAIL until the plans page is connected to checkout and subscription state.
- [ ] **Step 3: Implement checkout and account management UI**

  Link plan cards to the authenticated checkout route; provide a subscription screen with current effective plan, status, next charge/paid-through date, and cancellation action. Show provider/configuration errors explicitly.
- [ ] **Step 4: Implement cancellation**

  Require the authenticated owner, stop future Asaas charges server-side, record cancellation, and preserve access until the paid-through date. Display the destination-plan limits and allow selection of the post-launch ads to keep active; validate ownership and quota server-side and persist the selection. If no selection is made, use the spec's most-recently-updated fallback.
- [ ] **Step 5: Run tests, lint, and type-check**

  Run: `node --test tests/billing-cancel.test.mjs`
  Run: `node --test tests/subscription-ui.test.mjs`
  Run: `npx eslint src/app/planos/page.tsx src/app/assinatura/page.tsx src/app/api/billing/cancel/route.ts src/lib/billing/cancel-subscription.ts src/app/dashboard/page.tsx src/app/perfil/page.tsx src/app/anuncio/novo/page.tsx src/components/layout/Header.tsx`
  Run: `npx tsc --noEmit`
  Expected: PASS.
- [ ] **Step 6: Commit**

  `feat: gerencia assinatura e cancelamento`

### Task 5: Verify the billing integration and operational checklist

**Files:**
- Modify: `README.md`
- Modify: `.env.local.example`
- Test: `tests/asaas-client.test.mjs`
- Test: `tests/billing-checkout.test.mjs`
- Test: `tests/billing-cancel.test.mjs`
- Test: `tests/asaas-webhook.test.mjs`
- Test: `tests/subscription-ui.test.mjs`

- [ ] **Step 1: Run the billing test set**

  Run: `node --test tests/asaas-client.test.mjs tests/billing-checkout.test.mjs tests/billing-cancel.test.mjs tests/asaas-webhook.test.mjs tests/subscription-ui.test.mjs`
  Expected: PASS without live Asaas credentials.
- [ ] **Step 2: Run repository lint, type-check, and build**

  Run: `npm run lint`
  Run: `npx tsc --noEmit`
  Run: `npm run build`
  Expected: PASS.
- [ ] **Step 3: Document setup without secrets**

  Document `ASAAS_API_KEY`, `ASAAS_ENV`, `ASAAS_WEBHOOK_TOKEN`, server-only Supabase admin access, webhook URL, `CHECKOUT_PAID`, relevant payment and subscription events, monthly recurring credit-card checkout, sandbox test steps, and production activation. Do not add secret values.
- [ ] **Step 4: Commit**

  `test: valida fluxo de assinatura Asaas`

## Execution order

Run Tasks 1–3 in order, then Task 4, then Task 5. This plan is independent of
the completed product-foundation plan only after its schema, entitlement
module, and `/planos` page exist. Do not deploy production billing until
sandbox confirmation, cancellation, grace, and late-payment flows have been
verified manually.
