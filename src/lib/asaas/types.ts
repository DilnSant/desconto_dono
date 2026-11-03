export type AsaasEnvironment = 'sandbox' | 'production'

export type AsaasBillingType = 'CREDIT_CARD' | 'PIX' | 'BOLETO' | 'UNDEFINED'

export type AsaasSubscriptionCycle = 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY'

export type AsaasSubscriptionStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'EXPIRED'
  | 'OVERDUE'
  | 'PENDING'
  | 'CANCELED'

export type AsaasPaymentStatus =
  | 'PENDING'
  | 'RECEIVED'
  | 'CONFIRMED'
  | 'OVERDUE'
  | 'REFUNDED'
  | 'RECEIVED_IN_CASH'
  | 'REFUND_REQUESTED'
  | 'CHARGEBACK_REQUESTED'
  | 'CHARGEBACK_DISPUTE'
  | 'AWAITING_CHARGEBACK_REVERSAL'
  | 'DUNNING_REQUESTED'
  | 'DUNNING_RECEIVED'
  | 'AWAITING_RISK_ANALYSIS'

export type AsaasPayment = {
  id: string
  customer: string
  subscription?: string
  externalReference?: string
  billingType: AsaasBillingType
  status: AsaasPaymentStatus
  confirmedDate?: string
  paymentDate?: string
}

// ─── Customer ────────────────────────────────────────────────────────────────

export type AsaasCreateCustomerInput = {
  name: string
  email: string
  cpfCnpj?: string
  mobilePhone?: string
  externalReference?: string
}

export type AsaasCustomer = {
  id: string
  name: string
  email: string
  cpfCnpj?: string
  externalReference?: string
  dateCreated: string
}

// ─── Subscription ─────────────────────────────────────────────────────────────

export type AsaasCreateSubscriptionInput = {
  customer: string                 // ID do customer Asaas
  billingType: AsaasBillingType
  cycle: AsaasSubscriptionCycle
  value: number                    // em reais (ex: 39.90)
  nextDueDate: string              // YYYY-MM-DD
  description?: string
  externalReference?: string
  maxPayments?: number
  redirectUrl?: string
  checkoutSession?: {
    enabledPaymentMethods?: AsaasBillingType[]
  }
}

export type AsaasCreateCheckoutInput = {
  billingTypes: ['CREDIT_CARD']
  chargeTypes: ['RECURRENT']
  minutesToExpire: number
  externalReference: string
  callback: { successUrl: string; cancelUrl: string; expiredUrl: string }
  items: Array<{ name: string; description?: string; quantity: number; value: number }>
  customer?: string
  subscription: { cycle: 'MONTHLY'; nextDueDate: string }
}

export type AsaasCheckout = {
  id: string
  status: 'ACTIVE' | 'PAID' | 'CANCELED' | 'EXPIRED'
  externalReference?: string
}

export type AsaasCreateCheckoutResponse = { id: string }

export type AsaasSubscription = {
  id: string
  customer: string
  billingType: AsaasBillingType
  cycle: AsaasSubscriptionCycle
  value: number
  status: AsaasSubscriptionStatus
  nextDueDate: string
  externalReference?: string
  description?: string
  dateCreated: string
  paymentLink?: string
}

// ─── Checkout ─────────────────────────────────────────────────────────────────

export type AsaasPaymentCheckoutSession = {
  id: string
  url: string
  successUrl?: string
  enabled: boolean
}

// ─── Webhook ──────────────────────────────────────────────────────────────────

export type AsaasWebhookPayload = {
  id?: string
  event: string
  checkout?: { id: string; status: 'ACTIVE' | 'PAID' | 'CANCELED' | 'EXPIRED'; externalReference?: string }
  payment?: {
    id: string
    customer: string
    subscription?: string
    externalReference?: string
    billingType: AsaasBillingType
    status: AsaasPaymentStatus
    value: number
    netValue: number
    dueDate: string
    confirmedDate?: string
    paymentDate?: string
    invoiceUrl?: string
    checkoutSession?: string
    description?: string
  }
  subscription?: {
    id: string
    customer: string
    externalReference?: string
    billingType: AsaasBillingType
    status: AsaasSubscriptionStatus
    value: number
    cycle: AsaasSubscriptionCycle
    nextDueDate?: string
    endDate?: string
    description?: string
  }
}
