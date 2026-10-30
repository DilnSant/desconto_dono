-- ============================================================
-- DESCONTO DO DONO — Schema PostgreSQL v3 para Supabase
-- (Esquema completo do banco — Desconto do Dono)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUM: Tipos de plano (v3)
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.plan_type_enum AS ENUM ('Gratuito', 'Essencial', 'Profissional', 'Premium');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- TABELAS BASE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.categories (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  color      TEXT NOT NULL DEFAULT 'neutral',
  icon       TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subcategories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(category_id, slug)
);

-- ============================================================
-- PERFIS (lista de espera + membros ativos)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name         TEXT NOT NULL,
  email             TEXT,
  city              TEXT NOT NULL,
  state             TEXT NOT NULL,
  category_id       UUID REFERENCES public.categories(id),
  subcategory_id    UUID REFERENCES public.subcategories(id),
  has_company       BOOLEAN DEFAULT FALSE,
  accepted_terms    BOOLEAN DEFAULT FALSE NOT NULL,  -- Carta de Princípios + LGPD
  is_verified       BOOLEAN DEFAULT FALSE,
  is_active         BOOLEAN DEFAULT FALSE,           -- TRUE quando cidade é aberta
  business_name     TEXT,
  bio               TEXT,
  website_url       TEXT,
  whatsapp          TEXT,
  instagram_url     TEXT,
  email_public      TEXT,
  avatar_url        TEXT,
  cover_url         TEXT,
  is_premium        BOOLEAN DEFAULT FALSE,
  tiktok_url        TEXT,                             -- v3: TikTok
  public_whatsapp   TEXT,                             -- v3: WhatsApp público exibido no perfil
  plan_type         TEXT DEFAULT 'Gratuito',          -- v3: Gratuito | Essencial | Profissional | Premium
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- LISTA DE ESPERA (cadastros pré-abertura)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.waitlist (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name    TEXT NOT NULL,
  email        TEXT NOT NULL UNIQUE,
  city         TEXT NOT NULL,
  state        TEXT NOT NULL,
  category_id  UUID REFERENCES public.categories(id),
  has_company  BOOLEAN DEFAULT FALSE,
  accepted_terms BOOLEAN NOT NULL DEFAULT TRUE,
  referral_code TEXT,                            -- Código de quem indicou
  position     INTEGER,                          -- Posição na fila (calculada)
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- RANKING DE CIDADES (view materializada)
-- ============================================================
CREATE OR REPLACE VIEW public.cities_ranking AS
  SELECT
    city,
    state,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE has_company = TRUE) AS companies_count
  FROM public.waitlist
  GROUP BY city, state
  ORDER BY total DESC;

-- ============================================================
-- ANÚNCIOS (diretório de empresas / classificados B2B/B2C)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.listings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id     UUID REFERENCES public.categories(id),
  subcategory_id  UUID REFERENCES public.subcategories(id),
  title           TEXT NOT NULL,
  description     TEXT,
  price           NUMERIC(12,2),
  price_type      TEXT DEFAULT 'fixed',   -- fixed | negotiable | free
  image_url       TEXT,
  video_embed_url TEXT,                   -- v3: Embed YouTube/Instagram/TikTok
  location_city   TEXT,
  location_state  TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  views           INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- CLUBE DE BENEFÍCIOS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.benefits (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  discount_pct    INTEGER,
  discount_val    NUMERIC(10,2),
  link_url        TEXT,
  whatsapp        TEXT,
  video_embed_url TEXT,                  -- v3: Embed de vídeo promocional
  category_id     UUID REFERENCES public.categories(id),
  valid_until     DATE,
  is_active       BOOLEAN DEFAULT TRUE,
  redemptions     INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- LEADS (v3 - NOVO)
-- Registra quem resgatou um desconto via Modal
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_id        UUID NOT NULL REFERENCES public.benefits(id) ON DELETE CASCADE,
  client_name     TEXT NOT NULL,
  client_whatsapp TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- MENSAGERIA
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id  UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  content     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_waitlist_city     ON public.waitlist(city, state);
CREATE INDEX IF NOT EXISTS idx_listings_category ON public.listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_active   ON public.listings(is_active);
CREATE INDEX IF NOT EXISTS idx_benefits_active   ON public.benefits(is_active);
CREATE INDEX IF NOT EXISTS idx_messages_sender   ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_profiles_city     ON public.profiles(city, state);
CREATE INDEX IF NOT EXISTS idx_profiles_plan     ON public.profiles(plan_type);
CREATE INDEX IF NOT EXISTS idx_leads_offer       ON public.leads(offer_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benefits      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads         ENABLE ROW LEVEL SECURITY;

-- Categorias: leitura pública
CREATE POLICY "categories_public_read"    ON public.categories    FOR SELECT USING (true);
CREATE POLICY "subcategories_public_read" ON public.subcategories FOR SELECT USING (true);

-- Waitlist: inserção pública, leitura pública apenas de city/state/total
CREATE POLICY "waitlist_public_insert" ON public.waitlist FOR INSERT WITH CHECK (true);
CREATE POLICY "waitlist_public_read"   ON public.waitlist FOR SELECT USING (true);

-- Profiles
CREATE POLICY "profiles_public_read"  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_owner_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_owner_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Listings
CREATE POLICY "listings_public_read"  ON public.listings FOR SELECT USING (is_active = true);
CREATE POLICY "listings_owner_all"    ON public.listings FOR ALL   USING (auth.uid() = user_id);

-- Benefits
CREATE POLICY "benefits_public_read"  ON public.benefits FOR SELECT USING (is_active = true);
CREATE POLICY "benefits_owner_all"    ON public.benefits FOR ALL   USING (auth.uid() = author_id);

-- Leads: qualquer pessoa pode inserir, dono da oferta pode ler
CREATE POLICY "leads_public_insert"   ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "leads_author_read"     ON public.leads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.benefits b
      WHERE b.id = leads.offer_id AND b.author_id = auth.uid()
    )
  );

-- Messages
CREATE POLICY "messages_participant_read"   ON public.messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "messages_sender_insert"      ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- ============================================================
-- FUNÇÕES E TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER listings_updated_at BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER benefits_updated_at BEFORE UPDATE ON public.benefits FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Criar perfil ao registrar usuário (v3: inclui plan_type)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, city, state, accepted_terms, plan_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'city', ''),
    COALESCE(NEW.raw_user_meta_data->>'state', ''),
    COALESCE((NEW.raw_user_meta_data->>'accepted_terms')::boolean, false),
    'Gratuito'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SEED: Categorias e Subcategorias
-- ============================================================
INSERT INTO public.categories (id, name, slug, color, icon) VALUES
  ('11111111-0001-0001-0001-000000000001','Beleza','beleza','pink','Sparkles'),
  ('11111111-0002-0002-0002-000000000002','Comércios','comercios','blue','ShoppingBag'),
  ('11111111-0003-0003-0003-000000000003','Desenvolvedores','desenvolvedores','slate','Code2'),
  ('11111111-0004-0004-0004-000000000004','Diversos','diversos','neutral','LayoutGrid'),
  ('11111111-0005-0005-0005-000000000005','Ensino','ensino','cyan','GraduationCap'),
  ('11111111-0006-0006-0006-000000000006','Financeiras','financeiras','teal','Banknote'),
  ('11111111-0007-0007-0007-000000000007','Gastronomia','gastronomia','orange','UtensilsCrossed'),
  ('11111111-0008-0008-0008-000000000008','Hotelaria','hotelaria','purple','BedDouble'),
  ('11111111-0009-0009-0009-000000000009','Lazer','lazer','green','Dumbbell'),
  ('11111111-0010-0010-0010-000000000010','Marketing','marketing','rose','Megaphone'),
  ('11111111-0011-0011-0011-000000000011','Prestação de Serviços','prestacao-de-servicos','indigo','Wrench'),
  ('11111111-0012-0012-0012-000000000012','Saúde','saude','red','HeartPulse'),
  ('11111111-0013-0013-0013-000000000013','Serviços para seu Pet','servicos-pet','yellow','PawPrint'),
  ('11111111-0014-0014-0014-000000000014','Veículos','veiculos','gray','Car')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.subcategories (category_id,name,slug) VALUES
  ('11111111-0001-0001-0001-000000000001','Depilação','depilacao'),
  ('11111111-0001-0001-0001-000000000001','Estética','estetica'),
  ('11111111-0001-0001-0001-000000000001','Massagem','massagem'),
  ('11111111-0001-0001-0001-000000000001','Salões de Beleza','saloes-de-beleza'),
  ('11111111-0002-0002-0002-000000000002','Calçados','calcados'),
  ('11111111-0002-0002-0002-000000000002','Construção','construcao'),
  ('11111111-0002-0002-0002-000000000002','Móveis e Eletros','moveis-e-eletros'),
  ('11111111-0002-0002-0002-000000000002','Vestuário','vestuario'),
  ('11111111-0003-0003-0003-000000000003','Aplicativos','aplicativos'),
  ('11111111-0003-0003-0003-000000000003','Sites','sites'),
  ('11111111-0003-0003-0003-000000000003','Sistemas','sistemas'),
  ('11111111-0003-0003-0003-000000000003','CRMs','crms'),
  ('11111111-0004-0004-0004-000000000004','Segmentos não listados','segmentos-nao-listados'),
  ('11111111-0004-0004-0004-000000000004','Outros','outros'),
  ('11111111-0005-0005-0005-000000000005','Escolas','escolas'),
  ('11111111-0005-0005-0005-000000000005','Cursos','cursos'),
  ('11111111-0005-0005-0005-000000000005','Faculdades','faculdades'),
  ('11111111-0006-0006-0006-000000000006','Serviços Financeiros','servicos-financeiros'),
  ('11111111-0006-0006-0006-000000000006','Contabilidade','contabilidade'),
  ('11111111-0006-0006-0006-000000000006','Empréstimos','emprestimos'),
  ('11111111-0006-0006-0006-000000000006','Investimentos','investimentos'),
  ('11111111-0007-0007-0007-000000000007','Bares','bares'),
  ('11111111-0007-0007-0007-000000000007','Lanchonetes','lanchonetes'),
  ('11111111-0007-0007-0007-000000000007','Padarias','padarias'),
  ('11111111-0007-0007-0007-000000000007','Pizzarias','pizzarias'),
  ('11111111-0007-0007-0007-000000000007','Restaurantes','restaurantes'),
  ('11111111-0008-0008-0008-000000000008','Camping','camping'),
  ('11111111-0008-0008-0008-000000000008','Hotéis','hoteis'),
  ('11111111-0008-0008-0008-000000000008','Motéis','moteis'),
  ('11111111-0008-0008-0008-000000000008','Pousadas','pousadas'),
  ('11111111-0009-0009-0009-000000000009','Academias','academias'),
  ('11111111-0009-0009-0009-000000000009','Clubes','clubes'),
  ('11111111-0009-0009-0009-000000000009','Esportes','esportes'),
  ('11111111-0009-0009-0009-000000000009','Lan House','lan-house'),
  ('11111111-0010-0010-0010-000000000010','Divulgação','divulgacao'),
  ('11111111-0010-0010-0010-000000000010','Campanhas','campanhas'),
  ('11111111-0010-0010-0010-000000000010','Google','google'),
  ('11111111-0010-0010-0010-000000000010','Design de Marcas','design-de-marcas'),
  ('11111111-0011-0011-0011-000000000011','Residenciais','residenciais'),
  ('11111111-0011-0011-0011-000000000011','Comerciais','comerciais'),
  ('11111111-0012-0012-0012-000000000012','Clínicas','clinicas'),
  ('11111111-0012-0012-0012-000000000012','Dentistas','dentistas'),
  ('11111111-0012-0012-0012-000000000012','Farmácias','farmacias'),
  ('11111111-0012-0012-0012-000000000012','Médicos','medicos'),
  ('11111111-0012-0012-0012-000000000012','Óticas','oticas'),
  ('11111111-0012-0012-0012-000000000012','Produtos','produtos'),
  ('11111111-0013-0013-0013-000000000013','Agropecuárias','agropecuarias'),
  ('11111111-0013-0013-0013-000000000013','Clínicas Pet','clinicas-pet'),
  ('11111111-0013-0013-0013-000000000013','Pet Shop','pet-shop'),
  ('11111111-0014-0014-0014-000000000014','Acessórios','acessorios'),
  ('11111111-0014-0014-0014-000000000014','Elétrica','eletrica'),
  ('11111111-0014-0014-0014-000000000014','Lavação','lavacao'),
  ('11111111-0014-0014-0014-000000000014','Mecânica','mecanica'),
  ('11111111-0014-0014-0014-000000000014','Pintura','pintura'),
  ('11111111-0014-0014-0014-000000000014','Pneus','pneus'),
  ('11111111-0014-0014-0014-000000000014','Som','som')
ON CONFLICT DO NOTHING;

-- ============================================================
-- STORAGE BUCKETS (executar via Dashboard Supabase)
-- INSERT INTO storage.buckets (id,name,public) VALUES ('avatars','avatars',true),('covers','covers',true),('listings','listings',true) ON CONFLICT DO NOTHING;
-- ============================================================
