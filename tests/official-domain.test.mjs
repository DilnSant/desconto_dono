import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const readSource = (path) => readFileSync(new URL(path, `file://${process.cwd()}/`), 'utf8')

test('metadata and recovery use the official domain while OAuth returns to the active app origin', () => {
  const layout = readSource('src/app/layout.tsx')
  const login = readSource('src/components/auth/LoginForm.tsx')
  const recovery = readSource('src/app/recuperar-senha/page.tsx')

  assert.ok(layout.includes("metadataBase: new URL('https://www.descontododono.com.br')"))
  assert.ok(login.includes('redirectTo: `${window.location.origin}/auth/callback`'))
  assert.ok(
    recovery.includes("redirectTo: 'https://www.descontododono.com.br/atualizar-senha'")
  )
  assert.ok(!recovery.includes('window.location.origin'))
})
