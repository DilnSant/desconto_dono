export const ADMIN_LOGIN_EMAIL = 'metododevelops@gmail.com'

const adminConfirmationMessage =
  "Atenção Administrador: seu e-mail ainda não está confirmado no banco. Acesse o SQL Editor do Supabase e rode: UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = 'metododevelops@gmail.com';"

export function getAdminLoginErrorMessage(email: string, authError: string): string | null {
  if (email.trim().toLowerCase() !== ADMIN_LOGIN_EMAIL) return null

  const message = authError.toLowerCase()
  if (message.includes('not confirmed') || message.includes('email_not_confirmed')) {
    return adminConfirmationMessage
  }

  return null
}
