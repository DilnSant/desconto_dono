-- ==============================================================
-- DESCONTO DO DONO — Migração Incremental v3
-- ==============================================================
-- Script seguro: usa IF NOT EXISTS e IF EXISTS para não perder dados.
-- Execute no SQL Editor do Supabase Dashboard.
-- ==============================================================

-- ============================================================
-- 0. EXTENSÕES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. ENUM: plan_type (gratuito por padrão)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_type_enum') THEN
    CREATE TYPE plan_type_enum AS ENUM (
      'Gratuito',
      'Essencial',
      'Profissional',
      'Premium'
    );
  END IF;
END
$$;

-- ============================================================
-- 2. ALTER TABLE profiles — novos campos
-- ============================================================

-- 2.1 plan_type
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan_type plan_type_enum NOT NULL DEFAULT 'Gratuito';

-- 2.2 Instagram (handle sem @, ex: "minha_empresa")
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS instagram_url TEXT;

-- 2.3 TikTok (handle sem @)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tiktok_url TEXT;

-- 2.4 Website público
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS website_url TEXT;

-- 2.5 WhatsApp público (somente para planos Essencial+)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS public_whatsapp TEXT;

-- 2.6 E-mail público (somente para planos Essencial+)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email_public TEXT;

-- 2.7 is_premium: campo legado — mantido por compatibilidade
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT false;

-- ============================================================
-- 3. ALTER TABLE listings — video embed
-- ============================================================

-- URL de embed de vídeo (YouTube /embed/ ou Vimeo /video/)
-- Visível apenas para planos Profissional e Premium
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS video_embed_url TEXT;

-- ============================================================
-- 4. CREATE TABLE leads
-- ============================================================
-- Registra cada lead que clica em "Resgatar Desconto"
CREATE TABLE IF NOT EXISTS leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id        UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  owner_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_name     TEXT NOT NULL,
  client_whatsapp TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para consultas do dono do anúncio
CREATE INDEX IF NOT EXISTS idx_leads_offer_id  ON leads(offer_id);
CREATE INDEX IF NOT EXISTS idx_leads_owner_id  ON leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_created   ON leads(created_at DESC);

-- ============================================================
-- 5. RLS — leads
-- ============================================================
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas caso existam (idempotente)
DROP POLICY IF EXISTS "leads_insert_anon"      ON leads;
DROP POLICY IF EXISTS "leads_select_owner"     ON leads;
DROP POLICY IF EXISTS "leads_delete_owner"     ON leads;

-- 5.1 Qualquer pessoa (inclusive não autenticada) pode registrar interesse
CREATE POLICY "leads_insert_anon"
  ON leads FOR INSERT
  WITH CHECK (true);

-- 5.2 Apenas o dono do anúncio (via listings.user_id) pode ver seus leads
CREATE POLICY "leads_select_owner"
  ON leads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = leads.offer_id
        AND l.user_id = auth.uid()
    )
  );

-- 5.3 Apenas o dono pode apagar leads dos seus anúncios
CREATE POLICY "leads_delete_owner"
  ON leads FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = leads.offer_id
        AND l.user_id = auth.uid()
    )
  );

-- ============================================================
-- 6. ÍNDICES DE PERFORMANCE — listings / profiles
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_listings_user_id     ON listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_category_id ON listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_is_active   ON listings(is_active);
CREATE INDEX IF NOT EXISTS idx_listings_created_at  ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_plan_type   ON profiles(plan_type);
CREATE INDEX IF NOT EXISTS idx_profiles_city_state  ON profiles(city, state);

-- ============================================================
-- 7. VIEW: cities_ranking (ranking da lista de espera)
-- ============================================================
CREATE OR REPLACE VIEW cities_ranking AS
SELECT
  city,
  state,
  COUNT(*)                                     AS total,
  COUNT(*) FILTER (WHERE has_company = true)   AS companies_count
FROM waitlist
GROUP BY city, state
ORDER BY total DESC;

-- ============================================================
-- 8. FUNÇÃO + TRIGGER: preenche owner_id no INSERT de leads
-- (facilita a policy sem join em toda query SELECT)
-- ============================================================
CREATE OR REPLACE FUNCTION fn_set_lead_owner()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  SELECT user_id INTO NEW.owner_id
  FROM listings
  WHERE id = NEW.offer_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_lead_owner ON leads;

CREATE TRIGGER trg_set_lead_owner
  BEFORE INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION fn_set_lead_owner();

-- ============================================================
-- 9. RLS — tabelas existentes (garante que estão habilitadas)
-- ============================================================
ALTER TABLE profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefits   ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist   ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 10. GRANTS — permite INSERT em leads sem login
-- (necessário para visitantes resgatarem descontos)
-- ============================================================
GRANT INSERT ON leads TO anon;
GRANT INSERT ON leads TO authenticated;
GRANT SELECT ON leads TO authenticated;

-- ============================================================
-- FIM DO SCRIPT v3
-- ==============================================================
-- ✅ Seguro para rodar em banco com dados existentes
-- ✅ Todos os comandos são idempotentes (IF NOT EXISTS)
-- ✅ Nenhum dado é deletado ou sobrescrito
-- ==============================================================
