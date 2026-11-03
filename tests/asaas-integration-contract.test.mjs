import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const checkoutRoute = readFileSync(new URL('../src/app/api/asaas/checkout/route.ts', import.meta.url), 'utf8')
const webhookRoute = readFileSync(new URL('../src/app/api/asaas/webhook/route.ts', import.meta.url), 'utf8')
const asaasClient = readFileSync(new URL('../src/lib/asaas/client.ts', import.meta.url), 'utf8')
const checkoutButton = readFileSync(new URL('../src/app/planos/CheckoutButton.tsx', import.meta.url), 'utf8')

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
  assert.match(asaasClient, /sandbox: 'https:\/\/sandbox\.asaas\.com\/api\/v3'/)
})
