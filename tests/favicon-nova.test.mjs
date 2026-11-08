import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

const appIcon = new URL('../src/app/icon.png', import.meta.url)
const suppliedImage = new URL('../public/images/favicon.nova.png', import.meta.url)

test('uses the supplied favicon.nova.png as the only App Router icon', () => {
  assert.ok(existsSync(appIcon), 'Next.js app icon must use the new supplied PNG')
  assert.deepEqual(readFileSync(appIcon), readFileSync(suppliedImage))
  for (const obsoleteIcon of ['../src/app/favicon.ico', '../src/app/icon.jpg', '../src/app/icon.tsx']) {
    assert.equal(existsSync(new URL(obsoleteIcon, import.meta.url)), false, `${obsoleteIcon} must not override the new favicon`)
  }
})
