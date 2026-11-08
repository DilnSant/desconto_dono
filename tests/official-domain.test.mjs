import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const readSource = (path) => readFileSync(new URL(path, `file://${process.cwd()}/`), 'utf8')

test('metadata and recovery use the official domain while OAuth returns to the active app origin', () => {
  const layout = readSource('src/app/layout.tsx')
  const login = readSource('src/components/auth/LoginForm.tsx')
  const recovery = readSource('src/app/recuperar-senha/page.tsx')
  const redirects = readSource('src/lib/auth/redirects.ts')

  assert.ok(layout.includes("metadataBase: new URL('https://www.descontododono.com.br')"))
  assert.ok(login.includes('redirectTo: getAuthCallbackUrl(window.location.origin)'))
  assert.ok(redirects.includes("new URL('/auth/callback', origin).toString()"))
  assert.ok(
    recovery.includes("redirectTo: 'https://www.descontododono.com.br/atualizar-senha'")
  )
  assert.ok(!recovery.includes('window.location.origin'))
})
