import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const profilePage = readFileSync(new URL('../src/app/perfil/page.tsx', import.meta.url), 'utf8')
const registration = readFileSync(new URL('../src/components/auth/RegisterForm.tsx', import.meta.url), 'utf8')
const callback = readFileSync(new URL('../src/app/auth/callback/route.ts', import.meta.url), 'utf8')
const editor = readFileSync(new URL('../src/components/profiles/ProfileSegmentsEditor.tsx', import.meta.url), 'utf8')
const publicProfile = readFileSync(new URL('../src/app/perfil/[id]/page.tsx', import.meta.url), 'utf8')

test('offers commercial and residential choices on every segment in registration and profile editing', () => {
  assert.match(registration, /<ProfileSegmentsEditor/)
  assert.match(profilePage, /<ProfileSegmentsEditor/)
  assert.match(editor, /\['commercial', 'Empresas \(comercial\)'\]/)
  assert.match(editor, /\['residential', 'Residencial'\]/)
  assert.match(editor, /serviceAudiences: \['commercial', 'residential'\]/)
  assert.match(editor, /serviceAudiences\.length > 0/)
})

test('persists segment audiences both after immediate signup and email confirmation', () => {
  assert.match(registration, /db\.rpc\('save_profile_coverage_with_audiences'/)
  assert.match(registration, /serviceAudiences: segment\.serviceAudiences/)
  assert.match(callback, /supabase\.rpc\('save_profile_coverage_with_audiences'/)
  assert.match(callback, /p_segments: segments/)
})

test('publishes a profile only after its owner completes setup and saves it', () => {
  assert.match(registration, /update\(\{ is_active: true \}\)/)
  assert.match(callback, /update\(\{ is_active: true \}\)/)
  assert.match(profilePage, /is_active: true/)
  assert.ok(registration.indexOf("db.rpc('save_profile_coverage_with_audiences'") < registration.indexOf('update({ is_active: true })'))
  assert.ok(callback.indexOf("supabase.rpc('save_profile_coverage_with_audiences'") < callback.indexOf('update({ is_active: true })'))
})

test('keeps weekly service hours in Meu Perfil and exposes saved hours on the public profile', () => {
  assert.match(profilePage, /Horário de Atendimento/)
  assert.match(profilePage, /SERVICE_HOUR_DAYS\.map/)
  assert.match(profilePage, /hydrateServiceHours\(profileData\.service_hours\)/)
  assert.match(profilePage, /serializeServiceHours\(serviceHours\)/)
  assert.match(profilePage, /validateServiceHours\(serviceHours\)/)
  assert.match(publicProfile, /getPublicServiceHours\(typedProfile\.service_hours\)/)
  assert.match(publicProfile, /Horário de atendimento/)
  assert.doesNotMatch(registration, /Horário de Atendimento|SERVICE_HOUR_DAYS/)
  assert.match(registration, /p_service_hours: null/)
})
