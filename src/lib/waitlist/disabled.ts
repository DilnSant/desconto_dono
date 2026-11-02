export function createWaitlistDisabledResponse(): Response {
  return Response.json(
    {
      code: 'WAITLIST_CLOSED',
      message: 'A lista de espera foi encerrada. Crie uma conta gratuita para começar.',
    },
    {
      status: 410,
      headers: { 'cache-control': 'no-store' },
    },
  )
}
