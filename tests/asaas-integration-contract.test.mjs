import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const checkoutRoute = readFileSync(new URL('../src/app/api/asaas/checkout/route.ts', import.meta.url), 'utf8')
const asaasClient = readFileSync(new URL('../src/lib/asaas/client.ts', import.meta.url), 'utf8')
const checkoutButton = readFileSync(new URL('../src/app/planos/CheckoutButton.tsx', import.meta.url), 'utf8')
const cancelRoute = readFileSync(new URL('../src/app/api/asaas/cancel/route.ts', import.meta.url), 'utf8')
const subscriptionPage = readFileSync(new URL('../src/app/assinatura/page.tsx', import.meta.url), 'utf8')
const planPage = readFileSync(new URL('../src/app/planos/page.tsx', import.meta.url), 'utf8')
const webhookRoute = readFileSync(new URL('../src/app/api/asaas/webhook/route.ts', import.meta.url), 'utf8')

test('Asaas checkout authenticates the account owner and starts monthly recurring checkout', () => {
  assert.match(checkoutRoute, /sessionClient\.auth\.getUser\(\)/)
  assert.match(checkoutRoute, /profileId !== user\.id/)
  assert.ok(checkoutRoute.indexOf('sessionClient.auth.getUser()') < checkoutRoute.indexOf('createSupabaseAdminClient()'))
  assert.match(checkoutRoute, /createAsaasCheckout\(/)
  assert.match(checkoutRoute, /chargeTypes: \['RECURRENT'\]/)
  assert.match(checkoutRoute, /billingTypes: \['CREDIT_CARD'\]/)
  assert.match(checkoutButton, /Cartão de crédito recorrente/)
  assert.doesNotMatch(checkoutButton, /PIX/)
  assert.match(checkoutRoute, /getPlanMonthlyPriceCents\(plan\)/)
  assert.match(checkoutRoute, /getCheckoutCallbackUrls\([\s\S]*?process\.env\.NEXT_PUBLIC_APP_URL,[\s\S]*?process\.env\.VERCEL_URL/)
  assert.ok(checkoutRoute.indexOf('getCheckoutCallbackUrls(') < checkoutRoute.indexOf(".from('subscriptions')\n      .insert("))
  assert.match(asaasClient, /class AsaasApiError/)
  assert.match(checkoutRoute, /status: err\.status, codes: err\.codes/)
})

test('Asaas webhook requires its configured token and confirms provider payment state', () => {
  assert.match(webhookRoute, /if \(!expectedToken\?\.trim\(\)\) return false/)
  assert.match(webhookRoute, /timingSafeEqual/)
  assert.match(webhookRoute, /getAsaasCheckout\(payload\.checkout\.id\)/)
  assert.match(webhookRoute, /checkout\.status !== 'PAID'/)
  assert.match(webhookRoute, /getAsaasPayment\(payload\.payment\.id\)/)
  assert.match(webhookRoute, /payment_not_confirmed/)
})

test('Asaas API environment stays server-only and defaults to sandbox', () => {
  assert.match(asaasClient, /process\.env\.ASAAS_ENV === 'production'/)
  assert.doesNotMatch(asaasClient, /NEXT_PUBLIC_ASAAS_ENV/)
  assert.match(asaasClient, /sandbox: 'https:\/\/api-sandbox\.asaas\.com\/v3'/)
  assert.match(asaasClient, /production: 'https:\/\/api\.asaas\.com\/v3'/)
  assert.match(asaasClient, /return `https:\/\/asaas\.com\/checkoutSession\/show\?id=/)
})

test('subscription cancellation authenticates the owner and exposes account management', () => {
  assert.match(cancelRoute, /sessionClient\.auth\.getUser\(\)/)
  assert.match(cancelRoute, /cancelSubscription\(user\.id/)
  assert.match(cancelRoute, /\.eq\('profile_id', profileId\)/)
  assert.match(cancelRoute, /deactivateAsaasSubscription/)
  assert.match(subscriptionPage, /createSupabaseServerClient\(\)/)
  assert.match(subscriptionPage, /CancelSubscriptionButton/)
  assert.match(subscriptionPage, /: subscription\?\.current_period_end \?\? null/)
  assert.match(subscriptionPage, /status === 'CANCELED' && subscription\.grace_period_ends_at/)
  assert.match(readFileSync(new URL('../src/app/assinatura/CancelSubscriptionButton.tsx', import.meta.url), 'utf8'), /Cobranças já emitidas continuam válidas/)
  assert.match(planPage, /href="\/assinatura"/)
  assert.match(asaasClient, /method: 'PUT',[\s\S]*?body: JSON\.stringify\(\{ status: 'INACTIVE' \}\)/)
})

test('deleted Asaas subscriptions reconcile from the authenticated event without fetching a removed resource', () => {
  assert.match(webhookRoute, /if \(eventType !== 'SUBSCRIPTION_DELETED'\)[\s\S]*?getAsaasSubscription\(payload\.subscription\.id\)/)
  assert.match(webhookRoute, /const expectedToken = process\.env\.ASAAS_WEBHOOK_TOKEN/)
})
