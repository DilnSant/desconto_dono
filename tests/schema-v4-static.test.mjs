import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

const migrationPath = new URL('../supabase/schema_v4.sql', import.meta.url)

function expectMatch(source, pattern, message) {
  assert.ok(pattern.test(source), message)
}

function expectNoMatch(source, pattern, message) {
  assert.ok(!pattern.test(source), message)
}

test('schema v4 preserves data while enforcing entitlement and public-access contracts', () => {
  assert.ok(existsSync(migrationPath), 'Schema v4 migration must exist')

  const sql = readFileSync(migrationPath, 'utf8')
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')

  const requiredTables = [
    'profile_service_areas',
    'profile_categories',
    'profile_subcategories',
    'profile_gallery_images',
    'subscriptions',
    'asaas_webhook_events',
  ]
  for (const table of requiredTables) {
    expectMatch(sql, new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${table}\\b`, 'i'), `Missing table ${table}`)
  }

  expectMatch(sql, /CREATE OR REPLACE VIEW public\.profiles_public WITH \(security_barrier\s*=\s*true\)/i, 'Public profile view must be security-barrier')
  expectMatch(sql, /CREATE OR REPLACE VIEW public\.listings_public WITH \(security_barrier\s*=\s*true\)/i, 'Public listing view must be security-barrier')
  expectMatch(sql, /REVOKE ALL ON public\.profiles, public\.listings, public\.waitlist FROM PUBLIC, anon, authenticated/i, 'Base table access must be revoked before explicit grants')
  expectMatch(sql, /GRANT SELECT, INSERT, UPDATE ON public\.profiles TO authenticated/i, 'Authenticated owners need private profile access')
  expectMatch(sql, /REVOKE ALL ON public\.waitlist FROM PUBLIC, anon, authenticated/i, 'Waitlist access must be revoked')
  expectMatch(sql, /information_schema\.column_privileges[\s\S]*?REVOKE SELECT \(%I\) ON TABLE/i, 'Existing column-level public reads must be revoked')
  expectNoMatch(sql, /CREATE POLICY[^;]*ON public\.profiles[^;]*USING\s*\(\s*true\s*\)/i, 'Profiles must not have a broad public policy')
  expectNoMatch(sql, /CREATE POLICY[^;]*ON public\.waitlist[^;]*USING\s*\(\s*true\s*\)/i, 'Waitlist must not have a broad public policy')

  const profilesView = sql.match(/CREATE OR REPLACE VIEW public\.profiles_public[\s\S]*?;/i)?.[0]
  assert.ok(profilesView, 'Public profiles view must have a fixed projection')
  expectNoMatch(profilesView, /\bp\.email\b(?!_public)/i, 'Public profile view must not expose login email')
  expectNoMatch(profilesView, /\bp\.whatsapp\b/i, 'Public profile view must not expose private WhatsApp')
  expectNoMatch(profilesView, /\bp\.cover_url\b/i, 'Cover URLs must not be exposed directly')
  expectMatch(profilesView, /email_public/i, 'Paid public contacts may expose designated public email')
  expectMatch(profilesView, /public_whatsapp/i, 'Paid public contacts may expose designated WhatsApp')

  const listingsView = sql.match(/CREATE OR REPLACE VIEW public\.listings_public[\s\S]*?;/i)?.[0]
  assert.ok(listingsView, 'Public listings view must have a fixed projection')
  expectNoMatch(listingsView, /video_embed_url/i, 'Public listing projection must not expose legacy videos')
  expectMatch(listingsView, /grandfathered/i, 'Legacy listings must bypass the new listing quota')
  expectMatch(sql, /count\(\*\) FILTER \(WHERE NOT l\.grandfathered\) OVER/i, 'New-ad ranking must exclude grandfathered ads')

  expectMatch(sql, /UPDATE public\.listings\s+SET grandfathered\s*=\s*is_active\s+WHERE grandfathered IS NULL/i, 'Only preexisting listing rows should be grandfathered')
  expectMatch(sql, /ALTER TABLE public\.listings\s+ADD COLUMN IF NOT EXISTS grandfathered/i, 'Grandfathering must be idempotently added')
  expectMatch(sql, /INSERT INTO storage\.buckets \(id, name, public\)\s+VALUES \('covers', 'covers', false\)\s+ON CONFLICT \(id\) DO UPDATE SET public = false/i, 'Covers bucket must be private')
  expectMatch(sql, /covers_restrict_clients[\s\S]*?AS RESTRICTIVE FOR ALL TO anon, authenticated/i, 'Clients must not access the private covers bucket')
  expectNoMatch(sql, /DELETE\s+FROM storage\.objects/i, 'Migration must preserve storage objects')

  expectMatch(sql, /FUNCTION public\.get_effective_plan/i, 'Effective plan calculation must exist')
  expectMatch(sql, /grace_period_ends_at\s*>\s*(?:statement_timestamp|now)\(\)/i, 'Paid grace period must expire at its timestamp')
  expectMatch(sql, /current_period_end\s*>\s*(?:statement_timestamp|now)\(\)/i, 'Paid period must expire at its timestamp')
  expectMatch(sql, /FOR UPDATE/i, 'Quota checks must lock owner rows')
  expectMatch(sql, /SECURITY INVOKER/i, 'Database functions must use invoker privileges')
  expectMatch(sql, /FUNCTION public\.save_profile_coverage\s*\(\s*p_service_areas jsonb,\s*p_segments jsonb,\s*p_declared_non_presential boolean\s*\)/i, 'Coverage RPC signature must match the contract')
  const coverageFunction = sql.match(/CREATE OR REPLACE FUNCTION public\.save_profile_coverage[\s\S]*?\n\$\$;/i)?.[0]
  assert.ok(coverageFunction, 'Coverage RPC must be defined')
  assert.equal(
    (coverageFunction.match(/ORDER BY COALESCE\(\(item\.value ->> 'selectionOrder'\)::integer, item\.ordinality::integer - 1\), item\.ordinality/gi) ?? []).length,
    3,
    'Coverage selections must activate rows according to their explicit selection order',
  )
  expectMatch(sql, /FUNCTION public\.reserve_profile_gallery_slot\s*\(\s*p_profile_id uuid,\s*p_object_path text,\s*p_display_order integer\s*\)/i, 'Gallery RPC signature must match the contract')
  expectMatch(sql, /FUNCTION public\.apply_asaas_subscription_event\s*\(/i, 'Asaas event RPC must exist')
  expectMatch(sql, /REVOKE ALL ON FUNCTION[^;]*FROM PUBLIC, anon, authenticated/i, 'RPCs must revoke default public execution')
  expectMatch(sql, /GRANT EXECUTE ON FUNCTION public\.reserve_profile_gallery_slot[^;]*TO service_role/i, 'Gallery reservation must be service-role-only')
  expectMatch(sql, /GRANT EXECUTE ON FUNCTION public\.apply_asaas_subscription_event[^;]*TO service_role/i, 'Webhook application must be service-role-only')
  expectMatch(sql, /CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_one_open_per_profile_idx[\s\S]*?WHERE status IN \('PENDING', 'ACTIVE', 'PAST_DUE'\)/i, 'Only one open subscription may exist per profile')
  expectMatch(sql, /profiles_guard_entitlements[\s\S]*?BEFORE INSERT OR UPDATE ON public\.profiles/i, 'Plan and verification fields must be guarded on insert and update')
  expectMatch(sql, /NEW\.plan_type IS DISTINCT FROM OLD\.plan_type[\s\S]*?NEW\.is_verified IS DISTINCT FROM OLD\.is_verified/i, 'Clients must not change plan or verification')
  expectMatch(sql, /listings_enforce_entitlement[\s\S]*?BEFORE INSERT OR UPDATE OF user_id, is_active, grandfathered/i, 'Listing quotas must be checked on active inserts and updates')
  expectMatch(sql, /NEW\.grandfathered := false/i, 'Clients must not create grandfathered listings')
  expectMatch(sql, /p_event_at \+ interval '3 days'/i, 'Past-due subscriptions must receive exactly three days of grace')
  expectMatch(sql, /p_event_at <= subscription_row\.last_event_at/i, 'Stale provider events must be rejected')
  expectNoMatch(sql, /SECURITY DEFINER/i, 'Migration functions must not bypass RLS')
})
