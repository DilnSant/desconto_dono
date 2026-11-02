<<<<<<< HEAD
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  CREATE TYPE public.plan_type_enum AS ENUM (
    'Gratuito',
    'Essencial',
    'Profissional',
    'Premium'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

CREATE TABLE IF NOT EXISTS public.profile_service_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ibge_code text,
  municipality_name text,
  state_code text,
  is_national boolean NOT NULL DEFAULT false,
  declared_non_presential boolean NOT NULL DEFAULT false,
  selection_order integer NOT NULL DEFAULT 0 CHECK (selection_order >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  CONSTRAINT profile_service_areas_scope_check CHECK (
    (is_national
      AND ibge_code IS NULL
      AND municipality_name IS NULL
      AND state_code IS NULL
      AND declared_non_presential)
    OR
    (NOT is_national
      AND ibge_code ~ '^[0-9]{7}$'
      AND municipality_name IS NOT NULL
      AND length(trim(municipality_name)) > 0
      AND state_code ~ '^[A-Z]{2}$'
      AND NOT declared_non_presential)
  ),
  UNIQUE (profile_id, ibge_code)
);

CREATE UNIQUE INDEX IF NOT EXISTS profile_service_areas_one_national_idx
  ON public.profile_service_areas(profile_id)
  WHERE is_national;

CREATE INDEX IF NOT EXISTS profile_service_areas_lookup_idx
  ON public.profile_service_areas(ibge_code, profile_id)
  WHERE is_active;

CREATE TABLE IF NOT EXISTS public.profile_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  selection_order integer NOT NULL DEFAULT 0 CHECK (selection_order >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  UNIQUE (profile_id, category_id),
  UNIQUE (id, category_id)
);

CREATE INDEX IF NOT EXISTS profile_categories_profile_order_idx
  ON public.profile_categories(profile_id, selection_order);

CREATE UNIQUE INDEX IF NOT EXISTS subcategories_id_category_unique
  ON public.subcategories(id, category_id);

CREATE TABLE IF NOT EXISTS public.profile_subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_category_id uuid NOT NULL,
  category_id uuid NOT NULL,
  subcategory_id uuid NOT NULL,
  selection_order integer NOT NULL DEFAULT 0 CHECK (selection_order >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  CONSTRAINT profile_subcategories_profile_category_fk
    FOREIGN KEY (profile_category_id, category_id)
    REFERENCES public.profile_categories(id, category_id) ON DELETE CASCADE,
  CONSTRAINT profile_subcategories_catalog_category_fk
    FOREIGN KEY (subcategory_id, category_id)
    REFERENCES public.subcategories(id, category_id) ON DELETE CASCADE,
  UNIQUE (profile_category_id, subcategory_id)
);

CREATE INDEX IF NOT EXISTS profile_subcategories_category_order_idx
  ON public.profile_subcategories(profile_category_id, selection_order);

CREATE TABLE IF NOT EXISTS public.profile_gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  object_path text NOT NULL UNIQUE,
  display_order integer NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  upload_status text NOT NULL DEFAULT 'pending'
    CHECK (upload_status IN ('pending', 'ready', 'failed')),
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  CONSTRAINT profile_gallery_images_safe_path_check CHECK (
    object_path !~ '(^/|(^|/)[.][.]?(/|$))'
  )
);

CREATE INDEX IF NOT EXISTS profile_gallery_images_profile_order_idx
  ON public.profile_gallery_images(profile_id, display_order)
  WHERE is_active AND upload_status = 'ready';

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_type text NOT NULL CHECK (plan_type IN ('Essencial', 'Profissional')),
  asaas_subscription_id text UNIQUE,
  asaas_checkout_id text UNIQUE,
  external_reference text NOT NULL UNIQUE,
  asaas_customer_id text,
  billing_type text CHECK (billing_type IS NULL OR billing_type IN ('CREDIT_CARD', 'PIX')),
  status text NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED', 'FAILED')),
  current_period_end timestamptz,
  grace_period_ends_at timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  selected_listing_ids uuid[] NOT NULL DEFAULT '{}',
  last_event_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT statement_timestamp()
);

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_one_open_per_profile_idx
  ON public.subscriptions(profile_id)
  WHERE status IN ('PENDING', 'ACTIVE', 'PAST_DUE');

CREATE INDEX IF NOT EXISTS subscriptions_profile_status_idx
  ON public.subscriptions(profile_id, status, current_period_end DESC);

CREATE TABLE IF NOT EXISTS public.asaas_webhook_events (
  event_key text PRIMARY KEY,
  event_type text NOT NULL,
  resource_id text,
  processing_status text NOT NULL DEFAULT 'RECEIVED'
    CHECK (processing_status IN ('RECEIVED', 'PROCESSED', 'IGNORED', 'FAILED')),
  received_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  processed_at timestamptz
);

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS grandfathered boolean;

UPDATE public.listings
SET grandfathered = is_active
WHERE grandfathered IS NULL;

ALTER TABLE public.listings
  ALTER COLUMN grandfathered SET DEFAULT false,
  ALTER COLUMN grandfathered SET NOT NULL;

CREATE INDEX IF NOT EXISTS listings_owner_entitlement_idx
  ON public.listings(user_id, is_active, grandfathered, updated_at DESC);

INSERT INTO public.profile_categories (profile_id, category_id, selection_order, is_active)
SELECT p.id, p.category_id, 0, true
FROM public.profiles p
WHERE p.category_id IS NOT NULL
ON CONFLICT (profile_id, category_id) DO NOTHING;

INSERT INTO public.profile_subcategories (
  profile_category_id,
  category_id,
  subcategory_id,
  selection_order,
  is_active
)
SELECT pc.id, p.category_id, p.subcategory_id, 0, true
FROM public.profiles p
JOIN public.profile_categories pc
  ON pc.profile_id = p.id
 AND pc.category_id = p.category_id
JOIN public.subcategories sc
  ON sc.id = p.subcategory_id
 AND sc.category_id = p.category_id
WHERE p.subcategory_id IS NOT NULL
ON CONFLICT (profile_category_id, subcategory_id) DO NOTHING;

UPDATE public.profiles p
SET plan_type = 'Gratuito',
    is_premium = false
WHERE NOT EXISTS (
  SELECT 1
  FROM public.subscriptions s
  WHERE s.profile_id = p.id
    AND (
      (s.status = 'ACTIVE' AND s.current_period_end > statement_timestamp())
      OR (s.status = 'PAST_DUE' AND s.grace_period_ends_at > statement_timestamp())
      OR (s.status = 'CANCELED' AND s.current_period_end > statement_timestamp())
    )
);

ALTER TABLE public.profile_service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asaas_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "waitlist_public_insert" ON public.waitlist;
DROP POLICY IF EXISTS "waitlist_public_read" ON public.waitlist;

REVOKE ALL ON public.profiles, public.listings, public.waitlist FROM PUBLIC, anon, authenticated;
DO $$
DECLARE
  column_grant record;
BEGIN
  FOR column_grant IN
    SELECT table_name, column_name, grantee
    FROM information_schema.column_privileges
    WHERE table_schema = 'public'
      AND table_name IN ('profiles', 'listings', 'waitlist')
      AND grantee IN ('PUBLIC', 'anon', 'authenticated')
      AND privilege_type = 'SELECT'
  LOOP
    IF column_grant.grantee = 'PUBLIC' THEN
      EXECUTE format(
        'REVOKE SELECT (%I) ON TABLE public.%I FROM PUBLIC',
        column_grant.column_name,
        column_grant.table_name
      );
    ELSE
      EXECUTE format(
        'REVOKE SELECT (%I) ON TABLE public.%I FROM %I',
        column_grant.column_name,
        column_grant.table_name,
        column_grant.grantee
      );
    END IF;
  END LOOP;
END;
$$;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT SELECT ON public.categories, public.subcategories TO anon, authenticated;
REVOKE ALL ON public.waitlist FROM PUBLIC, anon, authenticated;

REVOKE ALL ON public.profile_service_areas, public.profile_categories,
  public.profile_subcategories, public.profile_gallery_images,
  public.subscriptions, public.asaas_webhook_events
FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_service_areas,
  public.profile_categories, public.profile_subcategories
TO authenticated;
GRANT SELECT ON public.profile_gallery_images, public.subscriptions TO authenticated;
GRANT ALL ON public.profile_service_areas, public.profile_categories,
  public.profile_subcategories, public.profile_gallery_images,
  public.subscriptions, public.asaas_webhook_events
TO service_role;

DO $$
DECLARE
  policy_row record;
BEGIN
  FOR policy_row IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'profiles',
        'listings',
        'waitlist',
        'profile_service_areas',
        'profile_categories',
        'profile_subcategories',
        'profile_gallery_images',
        'subscriptions',
        'asaas_webhook_events'
      )
  LOOP
    EXECUTE format(
      'DROP POLICY %I ON %I.%I',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );
  END LOOP;
END;
$$;

CREATE POLICY profiles_owner_select
  ON public.profiles FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = id);
CREATE POLICY profiles_owner_insert
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);
CREATE POLICY profiles_owner_update
  ON public.profiles FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY listings_owner_select
  ON public.listings FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY listings_owner_insert
  ON public.listings FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY listings_owner_update
  ON public.listings FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY listings_owner_delete
  ON public.listings FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY profile_service_areas_owner_all
  ON public.profile_service_areas FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = profile_id)
  WITH CHECK ((SELECT auth.uid()) = profile_id);
CREATE POLICY profile_categories_owner_all
  ON public.profile_categories FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = profile_id)
  WITH CHECK ((SELECT auth.uid()) = profile_id);
CREATE POLICY profile_subcategories_owner_all
  ON public.profile_subcategories FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profile_categories pc
      WHERE pc.id = profile_category_id
        AND pc.profile_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profile_categories pc
      WHERE pc.id = profile_category_id
        AND pc.profile_id = (SELECT auth.uid())
    )
  );
CREATE POLICY profile_gallery_images_owner_select
  ON public.profile_gallery_images FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = profile_id);
CREATE POLICY subscriptions_owner_select
  ON public.subscriptions FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = profile_id);

CREATE OR REPLACE FUNCTION public.get_effective_plan(p_profile_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  effective_plan text;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_profile_id THEN
    RAISE EXCEPTION 'Cannot inspect another profile plan'
      USING ERRCODE = '42501';
  END IF;

  IF auth.uid() IS NULL AND current_user NOT IN ('service_role', 'postgres') THEN
    RAISE EXCEPTION 'Authentication required'
      USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE((
    SELECT s.plan_type
    FROM public.subscriptions s
    WHERE s.profile_id = p_profile_id
      AND (
        (s.status = 'ACTIVE' AND s.current_period_end > statement_timestamp())
        OR (s.status = 'PAST_DUE' AND s.grace_period_ends_at > statement_timestamp())
        OR (s.status = 'CANCELED' AND s.current_period_end > statement_timestamp())
      )
    ORDER BY
      CASE s.status
        WHEN 'ACTIVE' THEN 1
        WHEN 'PAST_DUE' THEN 2
        WHEN 'CANCELED' THEN 3
        ELSE 4
      END,
      s.current_period_end DESC NULLS LAST
    LIMIT 1
  ), 'Gratuito')
  INTO effective_plan;

  RETURN effective_plan;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_profile_coverage(
  p_service_areas jsonb,
  p_segments jsonb,
  p_declared_non_presential boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_profile_id uuid := auth.uid();
  effective_plan text;
  max_areas integer;
  max_segments integer;
  max_subcategories integer;
  area_row record;
  segment_row record;
  subcategory_row record;
  v_category_id uuid;
  profile_category_id uuid;
  v_subcategory_id uuid;
  v_is_national boolean;
  active_category boolean;
  active_subcategory boolean;
  active_subcategory_count integer := 0;
  primary_category_id uuid;
  primary_subcategory_id uuid;
  national_count integer := 0;
  municipality_count integer := 0;
BEGIN
  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(p_service_areas) IS DISTINCT FROM 'array'
     OR jsonb_typeof(p_segments) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Coverage selections must be arrays';
  END IF;
  IF jsonb_array_length(p_service_areas) > 50
     OR jsonb_array_length(p_segments) > 50 THEN
    RAISE EXCEPTION 'Invalid coverage selection';
  END IF;

  PERFORM 1 FROM public.profiles p WHERE p.id = v_profile_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  effective_plan := public.get_effective_plan(v_profile_id);
  max_areas := CASE effective_plan WHEN 'Profissional' THEN 5 WHEN 'Essencial' THEN 3 ELSE 1 END;
  max_segments := CASE effective_plan WHEN 'Profissional' THEN 3 WHEN 'Essencial' THEN 2 ELSE 1 END;
  max_subcategories := CASE effective_plan WHEN 'Profissional' THEN 10 WHEN 'Essencial' THEN 6 ELSE 3 END;

  DELETE FROM public.profile_service_areas area
  WHERE area.profile_id = v_profile_id;

  FOR area_row IN
    SELECT item.value, item.ordinality
    FROM jsonb_array_elements(p_service_areas) WITH ORDINALITY AS item(value, ordinality)
    ORDER BY COALESCE((item.value ->> 'selectionOrder')::integer, item.ordinality::integer - 1), item.ordinality
  LOOP
    v_is_national := COALESCE((area_row.value ->> 'isNational')::boolean, false);
    IF v_is_national THEN
      national_count := national_count + 1;
      IF effective_plan = 'Gratuito' THEN
        RAISE EXCEPTION 'National coverage requires a paid plan';
      END IF;
      IF p_declared_non_presential IS DISTINCT FROM true
         OR COALESCE((area_row.value ->> 'declaredNonPresential')::boolean, false) IS DISTINCT FROM true THEN
        RAISE EXCEPTION 'National coverage requires a non-presential declaration';
      END IF;
      INSERT INTO public.profile_service_areas (
        profile_id, is_national, declared_non_presential, selection_order, is_active
      )
      VALUES (
        v_profile_id,
        true,
        true,
        COALESCE((area_row.value ->> 'selectionOrder')::integer, area_row.ordinality::integer - 1),
        area_row.ordinality <= max_areas
      );
    ELSE
      municipality_count := municipality_count + 1;
      INSERT INTO public.profile_service_areas (
        profile_id, ibge_code, municipality_name, state_code,
        selection_order, is_active
      )
      VALUES (
        v_profile_id,
        area_row.value ->> 'ibgeCode',
        area_row.value ->> 'name',
        area_row.value ->> 'stateCode',
        COALESCE((area_row.value ->> 'selectionOrder')::integer, area_row.ordinality::integer - 1),
        area_row.ordinality <= max_areas
      );
    END IF;
  END LOOP;

  IF national_count > 0 AND municipality_count > 0 THEN
    RAISE EXCEPTION 'National and municipal coverage cannot be combined';
  END IF;
  IF national_count > 1 THEN
    RAISE EXCEPTION 'Only one national coverage selection is allowed';
  END IF;

  DELETE FROM public.profile_subcategories ps
  USING public.profile_categories pc
  WHERE ps.profile_category_id = pc.id
    AND pc.profile_id = v_profile_id;
  DELETE FROM public.profile_categories pc WHERE pc.profile_id = v_profile_id;

  FOR segment_row IN
    SELECT item.value, item.ordinality
    FROM jsonb_array_elements(p_segments) WITH ORDINALITY AS item(value, ordinality)
    ORDER BY COALESCE((item.value ->> 'selectionOrder')::integer, item.ordinality::integer - 1), item.ordinality
  LOOP
    v_category_id := (segment_row.value ->> 'categoryId')::uuid;
    active_category := segment_row.ordinality <= max_segments;
    INSERT INTO public.profile_categories (
      profile_id, category_id, selection_order, is_active
    )
    VALUES (
      v_profile_id,
      v_category_id,
      COALESCE((segment_row.value ->> 'selectionOrder')::integer, segment_row.ordinality::integer - 1),
      active_category
    )
    RETURNING id INTO profile_category_id;

    IF primary_category_id IS NULL AND active_category THEN
      primary_category_id := v_category_id;
    END IF;

    IF jsonb_typeof(segment_row.value -> 'subcategories') IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'Each segment must provide a subcategories array';
    END IF;

    FOR subcategory_row IN
      SELECT item.value, item.ordinality
      FROM jsonb_array_elements(segment_row.value -> 'subcategories')
        WITH ORDINALITY AS item(value, ordinality)
      ORDER BY COALESCE((item.value ->> 'selectionOrder')::integer, item.ordinality::integer - 1), item.ordinality
    LOOP
      v_subcategory_id := (subcategory_row.value ->> 'subcategoryId')::uuid;
      IF NOT EXISTS (
        SELECT 1
        FROM public.subcategories sc
        WHERE sc.id = v_subcategory_id
          AND sc.category_id = v_category_id
      ) THEN
        RAISE EXCEPTION 'Subcategory does not belong to selected segment';
      END IF;

      active_subcategory :=
        active_category
        AND active_subcategory_count < max_subcategories;

      INSERT INTO public.profile_subcategories (
        profile_category_id,
        category_id,
        subcategory_id,
        selection_order,
        is_active
      )
      VALUES (
        profile_category_id,
        v_category_id,
        v_subcategory_id,
        COALESCE((subcategory_row.value ->> 'selectionOrder')::integer, subcategory_row.ordinality::integer - 1),
        active_subcategory
      );

      IF active_subcategory THEN
        active_subcategory_count := active_subcategory_count + 1;
        IF primary_category_id = v_category_id AND primary_subcategory_id IS NULL THEN
          primary_subcategory_id := v_subcategory_id;
        END IF;
      END IF;
    END LOOP;
  END LOOP;

  UPDATE public.profiles
  SET category_id = primary_category_id,
      subcategory_id = primary_subcategory_id,
      updated_at = statement_timestamp()
  WHERE id = v_profile_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reserve_profile_gallery_slot(
  p_profile_id uuid,
  p_object_path text,
  p_display_order integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  profile_cover_url text;
  effective_plan text;
  max_photos integer;
  used_photos integer;
  gallery_image_id uuid;
BEGIN
  IF p_profile_id IS NULL OR p_object_path IS NULL OR p_display_order < 0
     OR p_object_path !~ ('^' || p_profile_id::text || '/')
     OR p_object_path ~ '(^|/)[.][.]?(/|$)' THEN
    RAISE EXCEPTION 'Invalid gallery reservation';
  END IF;

  SELECT p.cover_url
  INTO profile_cover_url
  FROM public.profiles p
  WHERE p.id = p_profile_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  effective_plan := public.get_effective_plan(p_profile_id);
  max_photos := CASE effective_plan WHEN 'Profissional' THEN 10 WHEN 'Essencial' THEN 3 ELSE 0 END;

  SELECT
    CASE WHEN profile_cover_url IS NULL THEN 0 ELSE 1 END
      + count(*)::integer
  INTO used_photos
  FROM public.profile_gallery_images gi
  WHERE gi.profile_id = p_profile_id
    AND (
      gi.upload_status = 'pending'
      OR (gi.upload_status = 'ready' AND gi.is_active)
    );

  IF used_photos >= max_photos THEN
    RAISE EXCEPTION 'Profile photo limit reached';
  END IF;

  INSERT INTO public.profile_gallery_images (
    profile_id, object_path, display_order, upload_status, is_active
  )
  VALUES (p_profile_id, p_object_path, p_display_order, 'pending', false)
  RETURNING id INTO gallery_image_id;

  RETURN gallery_image_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.replace_profile_cover(
  p_profile_id uuid,
  p_object_path text
)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  previous_cover_url text;
  effective_plan text;
  max_photos integer;
  used_photos integer;
BEGIN
  IF p_profile_id IS NULL
     OR (p_object_path IS NOT NULL AND (
       p_object_path !~ ('^' || p_profile_id::text || '/')
       OR p_object_path ~ '(^|/)[.][.]?(/|$)'
       OR p_object_path ~ E'\\\\'
     )) THEN
    RAISE EXCEPTION 'Invalid profile cover';
  END IF;

  SELECT p.cover_url
  INTO previous_cover_url
  FROM public.profiles p
  WHERE p.id = p_profile_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  IF p_object_path IS NOT NULL THEN
    effective_plan := public.get_effective_plan(p_profile_id);
    max_photos := CASE effective_plan
      WHEN 'Profissional' THEN 10
      WHEN 'Essencial' THEN 3
      ELSE 0
    END;
    IF max_photos = 0 THEN
      RAISE EXCEPTION 'Profile photo limit reached'
        USING ERRCODE = '23514';
    END IF;

    IF previous_cover_url IS NULL THEN
      SELECT count(*)::integer
      INTO used_photos
      FROM public.profile_gallery_images gi
      WHERE gi.profile_id = p_profile_id
        AND (
          gi.upload_status = 'pending'
          OR (gi.upload_status = 'ready' AND gi.is_active)
        );
      IF used_photos >= max_photos THEN
        RAISE EXCEPTION 'Profile photo limit reached'
          USING ERRCODE = '23514';
      END IF;
    END IF;
  END IF;

  UPDATE public.profiles
  SET cover_url = p_object_path,
      updated_at = statement_timestamp()
  WHERE id = p_profile_id;

  RETURN previous_cover_url;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_profile_gallery_image(
  p_profile_id uuid,
  p_image_id uuid,
  p_display_order integer,
  p_is_active boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  profile_cover_url text;
  image_upload_status text;
  image_is_active boolean;
  effective_plan text;
  max_photos integer;
  used_photos integer;
BEGIN
  IF p_profile_id IS NULL OR p_image_id IS NULL
     OR p_display_order IS NULL OR p_display_order < 0
     OR p_is_active IS NULL THEN
    RAISE EXCEPTION 'Invalid gallery image update';
  END IF;

  SELECT p.cover_url
  INTO profile_cover_url
  FROM public.profiles p
  WHERE p.id = p_profile_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  SELECT gi.upload_status, gi.is_active
  INTO image_upload_status, image_is_active
  FROM public.profile_gallery_images gi
  WHERE gi.id = p_image_id
    AND gi.profile_id = p_profile_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gallery image not found'
      USING ERRCODE = 'P0002';
  END IF;

  IF p_is_active AND image_upload_status <> 'ready' THEN
    RAISE EXCEPTION 'Only uploaded gallery images can be activated';
  END IF;

  IF p_is_active AND NOT image_is_active THEN
    effective_plan := public.get_effective_plan(p_profile_id);
    max_photos := CASE effective_plan
      WHEN 'Profissional' THEN 10
      WHEN 'Essencial' THEN 3
      ELSE 0
    END;

    SELECT CASE WHEN profile_cover_url IS NULL THEN 0 ELSE 1 END
      + count(*)::integer
    INTO used_photos
    FROM public.profile_gallery_images gi
    WHERE gi.profile_id = p_profile_id
      AND gi.id <> p_image_id
      AND (
        gi.upload_status = 'pending'
        OR (gi.upload_status = 'ready' AND gi.is_active)
      );
    IF used_photos >= max_photos THEN
      RAISE EXCEPTION 'Profile photo limit reached'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  UPDATE public.profile_gallery_images
  SET display_order = p_display_order,
      is_active = p_is_active,
      updated_at = statement_timestamp()
  WHERE id = p_image_id
    AND profile_id = p_profile_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reorder_profile_gallery_images(
  p_profile_id uuid,
  p_image_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  owner_image_count integer;
  distinct_image_count integer;
BEGIN
  IF p_profile_id IS NULL OR p_image_ids IS NULL THEN
    RAISE EXCEPTION 'Invalid gallery image order';
  END IF;

  PERFORM 1
  FROM public.profiles p
  WHERE p.id = p_profile_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  SELECT count(*)::integer
  INTO owner_image_count
  FROM public.profile_gallery_images gi
  WHERE gi.profile_id = p_profile_id;

  SELECT count(DISTINCT requested.image_id)::integer
  INTO distinct_image_count
  FROM unnest(p_image_ids) AS requested(image_id);

  IF cardinality(p_image_ids) <> owner_image_count
     OR cardinality(p_image_ids) <> distinct_image_count
     OR EXISTS (
       SELECT 1
       FROM unnest(p_image_ids) AS requested(image_id)
       LEFT JOIN public.profile_gallery_images gi
         ON gi.id = requested.image_id
        AND gi.profile_id = p_profile_id
       WHERE gi.id IS NULL
     ) THEN
    RAISE EXCEPTION 'Gallery order must contain every owner image exactly once'
      USING ERRCODE = '23514';
  END IF;

  UPDATE public.profile_gallery_images gi
  SET display_order = requested.position::integer - 1,
      updated_at = statement_timestamp()
  FROM unnest(p_image_ids) WITH ORDINALITY AS requested(image_id, position)
  WHERE gi.id = requested.image_id
    AND gi.profile_id = p_profile_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_asaas_subscription_event(
  p_event_key text,
  p_event_type text,
  p_resource_id text,
  p_checkout_id text,
  p_asaas_subscription_id text,
  p_external_reference text,
  p_asaas_customer_id text,
  p_billing_type text,
  p_provider_status text,
  p_period_end timestamptz,
  p_event_at timestamptz
)
RETURNS TABLE (duplicate boolean, applied boolean)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  subscription_id uuid;
  subscription_row public.subscriptions%ROWTYPE;
  next_status text;
  next_period_end timestamptz;
  next_grace_period_ends_at timestamptz;
  effective_plan text;
  max_areas integer;
  max_segments integer;
  max_subcategories integer;
  max_photos integer;
  max_active_listings integer;
  has_cover boolean;
  profile_plan_uses_enum boolean;
BEGIN
  IF p_event_key IS NULL OR length(trim(p_event_key)) = 0
     OR p_event_type IS NULL OR p_event_at IS NULL THEN
    RAISE EXCEPTION 'Invalid Asaas event';
  END IF;

  INSERT INTO public.asaas_webhook_events (event_key, event_type, resource_id)
  VALUES (p_event_key, p_event_type, p_resource_id)
  ON CONFLICT (event_key) DO NOTHING;

  IF NOT FOUND THEN
    RETURN QUERY SELECT true, false;
    RETURN;
  END IF;

  IF p_external_reference IS NOT NULL THEN
    SELECT s.id INTO subscription_id
    FROM public.subscriptions s
    WHERE s.external_reference = p_external_reference
    FOR UPDATE;
  END IF;
  IF subscription_id IS NULL AND p_checkout_id IS NOT NULL THEN
    SELECT s.id INTO subscription_id
    FROM public.subscriptions s
    WHERE s.asaas_checkout_id = p_checkout_id
    FOR UPDATE;
  END IF;
  IF subscription_id IS NULL AND p_asaas_subscription_id IS NOT NULL THEN
    SELECT s.id INTO subscription_id
    FROM public.subscriptions s
    WHERE s.asaas_subscription_id = p_asaas_subscription_id
    FOR UPDATE;
  END IF;
  IF subscription_id IS NULL THEN
    RAISE EXCEPTION 'No pending subscription matches the Asaas event';
  END IF;

  SELECT s.* INTO subscription_row
  FROM public.subscriptions s
  WHERE s.id = subscription_id
  FOR UPDATE;

  IF (p_external_reference IS NOT NULL
      AND p_external_reference <> subscription_row.external_reference)
     OR (p_checkout_id IS NOT NULL
      AND subscription_row.asaas_checkout_id IS NOT NULL
      AND p_checkout_id <> subscription_row.asaas_checkout_id)
     OR (p_asaas_subscription_id IS NOT NULL
      AND subscription_row.asaas_subscription_id IS NOT NULL
      AND p_asaas_subscription_id <> subscription_row.asaas_subscription_id) THEN
    RAISE EXCEPTION 'Asaas event identifiers do not match the subscription';
  END IF;

  IF subscription_row.last_event_at IS NOT NULL
     AND p_event_at <= subscription_row.last_event_at THEN
    UPDATE public.asaas_webhook_events
    SET processing_status = 'IGNORED',
        processed_at = statement_timestamp()
    WHERE event_key = p_event_key;
    RETURN QUERY SELECT false, false;
    RETURN;
  END IF;

  next_status := CASE upper(p_event_type)
    WHEN 'CHECKOUT_PAID' THEN 'ACTIVE'
    WHEN 'PAYMENT_CONFIRMED' THEN 'ACTIVE'
    WHEN 'PAYMENT_RECEIVED' THEN 'ACTIVE'
    WHEN 'PAYMENT_OVERDUE' THEN 'PAST_DUE'
    WHEN 'SUBSCRIPTION_DELETED' THEN 'CANCELED'
    WHEN 'SUBSCRIPTION_CANCELED' THEN 'CANCELED'
    WHEN 'SUBSCRIPTION_EXPIRED' THEN 'EXPIRED'
    ELSE CASE upper(COALESCE(p_provider_status, ''))
      WHEN 'ACTIVE' THEN 'ACTIVE'
      WHEN 'PAST_DUE' THEN 'PAST_DUE'
      WHEN 'OVERDUE' THEN 'PAST_DUE'
      WHEN 'CANCELED' THEN 'CANCELED'
      WHEN 'CANCELLED' THEN 'CANCELED'
      WHEN 'EXPIRED' THEN 'EXPIRED'
      WHEN 'PENDING' THEN 'PENDING'
      WHEN 'FAILED' THEN 'FAILED'
      ELSE NULL
    END
  END;

  IF next_status IS NULL THEN
    UPDATE public.asaas_webhook_events
    SET processing_status = 'IGNORED',
        processed_at = statement_timestamp()
    WHERE event_key = p_event_key;
    RETURN QUERY SELECT false, false;
    RETURN;
  END IF;

  next_period_end := CASE
    WHEN next_status = 'ACTIVE' THEN
      COALESCE(p_period_end, subscription_row.current_period_end, p_event_at + interval '1 month')
    WHEN next_status = 'CANCELED' THEN
      COALESCE(p_period_end, subscription_row.current_period_end)
    ELSE COALESCE(p_period_end, subscription_row.current_period_end)
  END;
  next_grace_period_ends_at := CASE
    WHEN next_status = 'PAST_DUE' THEN p_event_at + interval '3 days'
    ELSE NULL
  END;

  UPDATE public.subscriptions
  SET asaas_checkout_id = COALESCE(p_checkout_id, asaas_checkout_id),
      asaas_subscription_id = COALESCE(p_asaas_subscription_id, asaas_subscription_id),
      asaas_customer_id = COALESCE(p_asaas_customer_id, asaas_customer_id),
      billing_type = COALESCE(p_billing_type, billing_type),
      status = next_status,
      current_period_end = next_period_end,
      grace_period_ends_at = next_grace_period_ends_at,
      cancel_at_period_end = next_status = 'CANCELED',
      last_event_at = p_event_at,
      updated_at = statement_timestamp()
  WHERE id = subscription_id;

  effective_plan := public.get_effective_plan(subscription_row.profile_id);
  SELECT attribute.atttypid = 'public.plan_type_enum'::regtype
  INTO profile_plan_uses_enum
  FROM pg_attribute attribute
  WHERE attribute.attrelid = 'public.profiles'::regclass
    AND attribute.attname = 'plan_type'
    AND NOT attribute.attisdropped;
  IF profile_plan_uses_enum THEN
    UPDATE public.profiles p
    SET plan_type = effective_plan::public.plan_type_enum,
        is_premium = false,
        updated_at = statement_timestamp()
    WHERE p.id = subscription_row.profile_id;
  ELSE
    UPDATE public.profiles p
    SET plan_type = effective_plan,
        is_premium = false,
        updated_at = statement_timestamp()
    WHERE p.id = subscription_row.profile_id;
  END IF;

  max_areas := CASE effective_plan WHEN 'Profissional' THEN 5 WHEN 'Essencial' THEN 3 ELSE 1 END;
  max_segments := CASE effective_plan WHEN 'Profissional' THEN 3 WHEN 'Essencial' THEN 2 ELSE 1 END;
  max_subcategories := CASE effective_plan WHEN 'Profissional' THEN 10 WHEN 'Essencial' THEN 6 ELSE 3 END;
  max_photos := CASE effective_plan WHEN 'Profissional' THEN 10 WHEN 'Essencial' THEN 3 ELSE 0 END;
  max_active_listings := CASE effective_plan WHEN 'Profissional' THEN 5 WHEN 'Essencial' THEN 3 ELSE 1 END;

  WITH ranked_areas AS (
    SELECT
      area.id,
      area.is_national,
      area.declared_non_presential,
      row_number() OVER (ORDER BY area.selection_order, area.id) AS area_order,
      bool_or(area.is_national) OVER () AS has_national
    FROM public.profile_service_areas area
    WHERE area.profile_id = subscription_row.profile_id
  )
  UPDATE public.profile_service_areas area
  SET is_active = CASE
    WHEN ranked_areas.is_national THEN effective_plan <> 'Gratuito' AND ranked_areas.declared_non_presential
    ELSE ranked_areas.area_order <= max_areas AND NOT ranked_areas.has_national
  END
  FROM ranked_areas
  WHERE area.id = ranked_areas.id
    AND area.is_active IS DISTINCT FROM CASE
      WHEN ranked_areas.is_national THEN effective_plan <> 'Gratuito' AND ranked_areas.declared_non_presential
      ELSE ranked_areas.area_order <= max_areas AND NOT ranked_areas.has_national
    END;

  WITH ranked_categories AS (
    SELECT
      category.id,
      row_number() OVER (ORDER BY category.selection_order, category.id) AS category_order
    FROM public.profile_categories category
    WHERE category.profile_id = subscription_row.profile_id
  )
  UPDATE public.profile_categories category
  SET is_active = ranked_categories.category_order <= max_segments
  FROM ranked_categories
  WHERE category.id = ranked_categories.id
    AND category.is_active IS DISTINCT FROM (ranked_categories.category_order <= max_segments);

  WITH ranked_subcategories AS (
    SELECT
      subcategory.id,
      category.is_active AS category_active,
      row_number() OVER (
        ORDER BY category.selection_order, subcategory.selection_order, subcategory.id
      ) AS subcategory_order
    FROM public.profile_subcategories subcategory
    JOIN public.profile_categories category
      ON category.id = subcategory.profile_category_id
    WHERE category.profile_id = subscription_row.profile_id
  )
  UPDATE public.profile_subcategories subcategory
  SET is_active = ranked_subcategories.category_active
    AND ranked_subcategories.subcategory_order <= max_subcategories
  FROM ranked_subcategories
  WHERE subcategory.id = ranked_subcategories.id
    AND subcategory.is_active IS DISTINCT FROM (
      ranked_subcategories.category_active
      AND ranked_subcategories.subcategory_order <= max_subcategories
    );

  SELECT p.cover_url IS NOT NULL
  INTO has_cover
  FROM public.profiles p
  WHERE p.id = subscription_row.profile_id;

  WITH ranked_photos AS (
    SELECT
      photo.id,
      photo.upload_status,
      row_number() OVER (ORDER BY photo.display_order, photo.created_at, photo.id) AS photo_order
    FROM public.profile_gallery_images photo
    WHERE photo.profile_id = subscription_row.profile_id
      AND photo.upload_status = 'ready'
  )
  UPDATE public.profile_gallery_images photo
  SET is_active = ranked_photos.upload_status = 'ready'
    AND ranked_photos.photo_order <= GREATEST(0, max_photos - CASE WHEN has_cover THEN 1 ELSE 0 END)
  FROM ranked_photos
  WHERE photo.id = ranked_photos.id
    AND photo.is_active IS DISTINCT FROM (
      ranked_photos.upload_status = 'ready'
      AND ranked_photos.photo_order <= GREATEST(0, max_photos - CASE WHEN has_cover THEN 1 ELSE 0 END)
    );

  WITH selection AS (
    SELECT s.selected_listing_ids
    FROM public.subscriptions s
    WHERE s.profile_id = subscription_row.profile_id
    ORDER BY s.created_at DESC, s.id DESC
    LIMIT 1
  ),
  ranked_listings AS (
    SELECT
      listing.id,
      COALESCE(cardinality(selection.selected_listing_ids), 0) > 0 AS has_selection,
      listing.id = ANY(COALESCE(selection.selected_listing_ids, '{}'::uuid[])) AS selected,
      array_position(COALESCE(selection.selected_listing_ids, '{}'::uuid[]), listing.id) AS selection_order,
      row_number() OVER (
        ORDER BY listing.updated_at DESC NULLS LAST, listing.created_at DESC, listing.id
      ) AS recent_order
    FROM public.listings listing
    CROSS JOIN selection
    WHERE listing.user_id = subscription_row.profile_id
      AND listing.is_active
      AND NOT listing.grandfathered
  )
  UPDATE public.listings listing
  SET is_active = false
  FROM ranked_listings
  WHERE listing.id = ranked_listings.id
    AND (
      (ranked_listings.has_selection
        AND (NOT ranked_listings.selected OR ranked_listings.selection_order > max_active_listings))
      OR (NOT ranked_listings.has_selection AND ranked_listings.recent_order > max_active_listings)
    );

  UPDATE public.asaas_webhook_events
  SET processing_status = 'PROCESSED',
      processed_at = statement_timestamp()
  WHERE event_key = p_event_key;

  RETURN QUERY SELECT false, true;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_profile_entitlements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    IF TG_OP = 'INSERT' AND (
      NEW.plan_type IS DISTINCT FROM 'Gratuito'
      OR NEW.is_verified IS DISTINCT FROM false
      OR NEW.is_premium IS DISTINCT FROM false
    ) THEN
      RAISE EXCEPTION 'Plan and verification fields are managed by the platform'
        USING ERRCODE = '42501';
    END IF;

    IF TG_OP = 'UPDATE' AND (
      NEW.plan_type IS DISTINCT FROM OLD.plan_type
      OR NEW.is_verified IS DISTINCT FROM OLD.is_verified
      OR NEW.is_premium IS DISTINCT FROM OLD.is_premium
    ) THEN
      RAISE EXCEPTION 'Plan and verification fields are managed by the platform'
        USING ERRCODE = '42501';
    END IF;

    IF TG_OP = 'INSERT' AND NEW.cover_url IS NOT NULL THEN
      RAISE EXCEPTION 'Cover images are managed by the server'
        USING ERRCODE = '42501';
    END IF;

    IF TG_OP = 'UPDATE' AND NEW.cover_url IS DISTINCT FROM OLD.cover_url THEN
      RAISE EXCEPTION 'Cover images are managed by the server'
        USING ERRCODE = '42501';
    END IF;

    IF NEW.category_id IS NOT NULL AND NOT EXISTS (
      SELECT 1
      FROM public.profile_categories category
      WHERE category.profile_id = NEW.id
        AND category.category_id = NEW.category_id
        AND category.is_active
    ) THEN
      RAISE EXCEPTION 'Primary category must be an active selected segment'
        USING ERRCODE = '23514';
    END IF;

    IF NEW.subcategory_id IS NOT NULL AND NOT EXISTS (
      SELECT 1
      FROM public.profile_categories category
      JOIN public.profile_subcategories subcategory
        ON subcategory.profile_category_id = category.id
      WHERE category.profile_id = NEW.id
        AND category.category_id = NEW.category_id
        AND category.is_active
        AND subcategory.subcategory_id = NEW.subcategory_id
        AND subcategory.is_active
    ) THEN
      RAISE EXCEPTION 'Primary subcategory must be an active selected subcategory'
        USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_listing_entitlement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  effective_plan text;
  max_active_listings integer;
  active_new_listings integer;
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.grandfathered := false;
  ELSIF auth.uid() IS NOT NULL AND NEW.grandfathered IS DISTINCT FROM OLD.grandfathered THEN
    RAISE EXCEPTION 'Grandfathered listing state is managed by the platform'
      USING ERRCODE = '42501';
  END IF;

  IF NOT NEW.is_active OR NEW.grandfathered THEN
    RETURN NEW;
  END IF;

  PERFORM 1
  FROM public.profiles p
  WHERE p.id = NEW.user_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing owner profile not found';
  END IF;

  effective_plan := public.get_effective_plan(NEW.user_id);
  max_active_listings := CASE effective_plan
    WHEN 'Profissional' THEN 5
    WHEN 'Essencial' THEN 3
    ELSE 1
  END;

  SELECT count(*)::integer
  INTO active_new_listings
  FROM public.listings l
  WHERE l.user_id = NEW.user_id
    AND l.is_active
    AND NOT l.grandfathered
    AND (TG_OP = 'INSERT' OR l.id <> NEW.id);

  IF active_new_listings >= max_active_listings THEN
    RAISE EXCEPTION 'Active listing limit reached for plan %', effective_plan
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_profile_service_area_entitlement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  effective_plan text;
  max_areas integer;
  existing_active_count integer;
  v_profile_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  IF TG_OP = 'UPDATE'
     AND NEW.is_active IS NOT DISTINCT FROM OLD.is_active
     AND NEW.is_national IS NOT DISTINCT FROM OLD.is_national
     AND NEW.declared_non_presential IS NOT DISTINCT FROM OLD.declared_non_presential
     AND NEW.profile_id IS NOT DISTINCT FROM OLD.profile_id THEN
    RETURN NEW;
  END IF;
  v_profile_id := NEW.profile_id;
  PERFORM 1 FROM public.profiles p WHERE p.id = v_profile_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service-area owner profile not found';
  END IF;
  IF NOT NEW.is_active THEN
    RETURN NEW;
  END IF;

  effective_plan := public.get_effective_plan(v_profile_id);
  max_areas := CASE effective_plan WHEN 'Profissional' THEN 5 WHEN 'Essencial' THEN 3 ELSE 1 END;
  IF NEW.is_national AND effective_plan = 'Gratuito' THEN
    RAISE EXCEPTION 'National coverage requires a paid plan';
  END IF;
  IF NEW.is_national AND NEW.declared_non_presential IS NOT TRUE THEN
    RAISE EXCEPTION 'National coverage requires a non-presential declaration';
  END IF;

  SELECT count(*)::integer
  INTO existing_active_count
  FROM public.profile_service_areas area
  WHERE area.profile_id = v_profile_id
    AND area.is_active
    AND (TG_OP = 'INSERT' OR area.id <> NEW.id);

  IF existing_active_count >= max_areas THEN
    RAISE EXCEPTION 'Service-area limit reached for plan %', effective_plan
      USING ERRCODE = '23514';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM public.profile_service_areas area
    WHERE area.profile_id = v_profile_id
      AND area.is_active
      AND (TG_OP = 'INSERT' OR area.id <> NEW.id)
      AND area.is_national IS DISTINCT FROM NEW.is_national
  ) THEN
    RAISE EXCEPTION 'National and municipal coverage cannot be combined';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_profile_category_entitlement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  effective_plan text;
  max_segments integer;
  existing_active_count integer;
  v_profile_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  IF TG_OP = 'UPDATE'
     AND NEW.is_active IS NOT DISTINCT FROM OLD.is_active
     AND NEW.category_id IS NOT DISTINCT FROM OLD.category_id
     AND NEW.profile_id IS NOT DISTINCT FROM OLD.profile_id THEN
    RETURN NEW;
  END IF;
  v_profile_id := NEW.profile_id;
  PERFORM 1 FROM public.profiles p WHERE p.id = v_profile_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Category owner profile not found';
  END IF;
  IF NOT NEW.is_active THEN
    UPDATE public.profile_subcategories subcategory
    SET is_active = false
    WHERE subcategory.profile_category_id = NEW.id
      AND subcategory.is_active;
    RETURN NEW;
  END IF;

  effective_plan := public.get_effective_plan(v_profile_id);
  max_segments := CASE effective_plan WHEN 'Profissional' THEN 3 WHEN 'Essencial' THEN 2 ELSE 1 END;
  SELECT count(*)::integer
  INTO existing_active_count
  FROM public.profile_categories category
  WHERE category.profile_id = v_profile_id
    AND category.is_active
    AND (TG_OP = 'INSERT' OR category.id <> NEW.id);

  IF existing_active_count >= max_segments THEN
    RAISE EXCEPTION 'Segment limit reached for plan %', effective_plan
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_profile_subcategory_entitlement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  effective_plan text;
  max_subcategories integer;
  v_profile_id uuid;
  category_is_active boolean;
  existing_active_count integer;
  selected_profile_category_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  IF TG_OP = 'UPDATE'
     AND NEW.is_active IS NOT DISTINCT FROM OLD.is_active
     AND NEW.profile_category_id IS NOT DISTINCT FROM OLD.profile_category_id
     AND NEW.category_id IS NOT DISTINCT FROM OLD.category_id
     AND NEW.subcategory_id IS NOT DISTINCT FROM OLD.subcategory_id THEN
    RETURN NEW;
  END IF;
  selected_profile_category_id := NEW.profile_category_id;
  SELECT pc.profile_id
  INTO v_profile_id
  FROM public.profile_categories pc
  WHERE pc.id = selected_profile_category_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Selected profile segment not found';
  END IF;
  PERFORM 1 FROM public.profiles p WHERE p.id = v_profile_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subcategory owner profile not found';
  END IF;
  SELECT pc.is_active
  INTO category_is_active
  FROM public.profile_categories pc
  WHERE pc.id = selected_profile_category_id
  FOR UPDATE;
  IF NOT NEW.is_active THEN
    RETURN NEW;
  END IF;
  IF category_is_active IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Subcategory cannot be active under an inactive segment';
  END IF;

  effective_plan := public.get_effective_plan(v_profile_id);
  max_subcategories := CASE effective_plan WHEN 'Profissional' THEN 10 WHEN 'Essencial' THEN 6 ELSE 3 END;
  SELECT count(*)::integer
  INTO existing_active_count
  FROM public.profile_subcategories subcategory
  JOIN public.profile_categories category ON category.id = subcategory.profile_category_id
  WHERE category.profile_id = v_profile_id
    AND subcategory.is_active
    AND (TG_OP = 'INSERT' OR subcategory.id <> NEW.id);
  IF existing_active_count >= max_subcategories THEN
    RAISE EXCEPTION 'Subcategory limit reached for plan %', effective_plan
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_guard_entitlements ON public.profiles;
CREATE TRIGGER profiles_guard_entitlements
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_entitlements();

DROP TRIGGER IF EXISTS listings_enforce_entitlement ON public.listings;
CREATE TRIGGER listings_enforce_entitlement
  BEFORE INSERT OR UPDATE OF user_id, is_active, grandfathered ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.enforce_listing_entitlement();

DROP TRIGGER IF EXISTS profile_service_areas_enforce_entitlement ON public.profile_service_areas;
CREATE TRIGGER profile_service_areas_enforce_entitlement
  BEFORE INSERT OR UPDATE OR DELETE ON public.profile_service_areas
  FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_service_area_entitlement();

DROP TRIGGER IF EXISTS profile_categories_enforce_entitlement ON public.profile_categories;
CREATE TRIGGER profile_categories_enforce_entitlement
  BEFORE INSERT OR UPDATE OR DELETE ON public.profile_categories
  FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_category_entitlement();

DROP TRIGGER IF EXISTS profile_subcategories_enforce_entitlement ON public.profile_subcategories;
CREATE TRIGGER profile_subcategories_enforce_entitlement
  BEFORE INSERT OR UPDATE OR DELETE ON public.profile_subcategories
  FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_subcategory_entitlement();

CREATE OR REPLACE FUNCTION public.increment_public_listing_view(p_listing_id uuid)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $function$
  UPDATE public.listings
  SET views = COALESCE(views, 0) + 1
  WHERE id = p_listing_id
    AND is_active IS TRUE;
$function$;

REVOKE ALL ON FUNCTION public.increment_public_listing_view(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_public_listing_view(uuid) TO service_role;

CREATE OR REPLACE VIEW public.profiles_public WITH (security_barrier = true) AS
SELECT
  p.id,
  p.full_name,
  p.business_name,
  p.bio,
  p.city,
  p.state,
  p.avatar_url,
  primary_segment.category_id AS category_id,
  category.name AS category_name,
  primary_subcategory.subcategory_id AS subcategory_id,
  subcategory.name AS subcategory_name,
  p.is_verified,
  COALESCE(effective.plan_type, 'Gratuito') AS plan_type,
  CASE
    WHEN COALESCE(effective.plan_type, 'Gratuito') IN ('Essencial', 'Profissional')
    THEN p.email_public
    ELSE NULL
  END AS email_public,
  CASE
    WHEN COALESCE(effective.plan_type, 'Gratuito') IN ('Essencial', 'Profissional')
    THEN p.public_whatsapp
    ELSE NULL
  END AS public_whatsapp,
  CASE
    WHEN COALESCE(effective.plan_type, 'Gratuito') IN ('Essencial', 'Profissional')
    THEN p.website_url
    ELSE NULL
  END AS website_url,
  CASE
    WHEN COALESCE(effective.plan_type, 'Gratuito') IN ('Essencial', 'Profissional')
    THEN p.instagram_url
    ELSE NULL
  END AS instagram_url,
  CASE
    WHEN COALESCE(effective.plan_type, 'Gratuito') IN ('Essencial', 'Profissional')
    THEN p.tiktok_url
    ELSE NULL
  END AS tiktok_url,
  p.created_at,
  ARRAY(
    SELECT selected.category_id
    FROM public.profile_categories selected
    WHERE selected.profile_id = p.id
      AND selected.is_active
    ORDER BY selected.selection_order, selected.id
    LIMIT CASE COALESCE(effective.plan_type, 'Gratuito')
        WHEN 'Profissional' THEN 3
        WHEN 'Essencial' THEN 2
        ELSE 1
      END
  ) AS segment_ids,
  ARRAY(
    SELECT selected_subcategory.subcategory_id
    FROM public.profile_categories selected_category
    JOIN public.profile_subcategories selected_subcategory
      ON selected_subcategory.profile_category_id = selected_category.id
    WHERE selected_category.profile_id = p.id
      AND selected_category.is_active
      AND selected_subcategory.is_active
    ORDER BY selected_category.selection_order, selected_subcategory.selection_order, selected_subcategory.id
    LIMIT CASE COALESCE(effective.plan_type, 'Gratuito')
        WHEN 'Profissional' THEN 10
        WHEN 'Essencial' THEN 6
        ELSE 3
      END
  ) AS subcategory_ids,
  ARRAY(
    SELECT area.ibge_code
    FROM public.profile_service_areas area
    WHERE area.profile_id = p.id
      AND area.is_active
      AND NOT area.is_national
    ORDER BY area.selection_order, area.id
    LIMIT CASE COALESCE(effective.plan_type, 'Gratuito')
        WHEN 'Profissional' THEN 5
        WHEN 'Essencial' THEN 3
        ELSE 1
      END
  ) AS service_area_ibge_codes,
  ARRAY(
    SELECT area.municipality_name || ', ' || area.state_code
    FROM public.profile_service_areas area
    WHERE area.profile_id = p.id
      AND area.is_active
      AND NOT area.is_national
    ORDER BY area.selection_order, area.id
    LIMIT CASE COALESCE(effective.plan_type, 'Gratuito')
        WHEN 'Profissional' THEN 5
        WHEN 'Essencial' THEN 3
        ELSE 1
      END
  ) AS service_area_names,
  EXISTS (
    SELECT 1
    FROM public.profile_service_areas area
    WHERE area.profile_id = p.id
      AND area.is_active
      AND area.is_national
      AND COALESCE(effective.plan_type, 'Gratuito') IN ('Essencial', 'Profissional')
  ) AS national_coverage,
  ARRAY(
    SELECT area.state_code
    FROM public.profile_service_areas area
    WHERE area.profile_id = p.id
      AND area.is_active
      AND NOT area.is_national
    ORDER BY area.selection_order, area.id
    LIMIT CASE COALESCE(effective.plan_type, 'Gratuito')
        WHEN 'Profissional' THEN 5
        WHEN 'Essencial' THEN 3
        ELSE 1
      END
  ) AS service_area_state_codes
FROM public.profiles p
LEFT JOIN LATERAL (
  SELECT s.plan_type
  FROM public.subscriptions s
  WHERE s.profile_id = p.id
    AND (
      (s.status = 'ACTIVE' AND s.current_period_end > statement_timestamp())
      OR (s.status = 'PAST_DUE' AND s.grace_period_ends_at > statement_timestamp())
      OR (s.status = 'CANCELED' AND s.current_period_end > statement_timestamp())
    )
  ORDER BY
    CASE s.status
      WHEN 'ACTIVE' THEN 1
      WHEN 'PAST_DUE' THEN 2
      WHEN 'CANCELED' THEN 3
      ELSE 4
    END,
    s.current_period_end DESC NULLS LAST
  LIMIT 1
) effective ON true
LEFT JOIN LATERAL (
  SELECT selected.id, selected.category_id
  FROM public.profile_categories selected
  WHERE selected.profile_id = p.id
    AND selected.is_active
  ORDER BY selected.selection_order, selected.id
  LIMIT CASE COALESCE(effective.plan_type, 'Gratuito')
      WHEN 'Profissional' THEN 3
      WHEN 'Essencial' THEN 2
      ELSE 1
    END
) primary_segment ON true
LEFT JOIN LATERAL (
  SELECT selected.subcategory_id
  FROM public.profile_subcategories selected
  WHERE selected.profile_category_id = primary_segment.id
    AND selected.is_active
  ORDER BY selected.selection_order, selected.id
  LIMIT 1
) primary_subcategory ON true
LEFT JOIN public.categories category ON category.id = primary_segment.category_id
LEFT JOIN public.subcategories subcategory
  ON subcategory.id = primary_subcategory.subcategory_id
 AND subcategory.category_id = primary_segment.category_id
WHERE p.accepted_terms IS TRUE
  AND p.is_active IS TRUE;

CREATE OR REPLACE VIEW public.listings_public WITH (security_barrier = true) AS
WITH plans AS (
  SELECT
    p.id AS profile_id,
    CASE COALESCE(effective.plan_type, 'Gratuito')
      WHEN 'Profissional' THEN 5
      WHEN 'Essencial' THEN 3
      ELSE 1
    END AS active_listing_limit,
    COALESCE(selection.selected_listing_ids, '{}'::uuid[]) AS selected_listing_ids
  FROM public.profiles p
  LEFT JOIN LATERAL (
    SELECT s.plan_type
    FROM public.subscriptions s
    WHERE s.profile_id = p.id
      AND (
        (s.status = 'ACTIVE' AND s.current_period_end > statement_timestamp())
        OR (s.status = 'PAST_DUE' AND s.grace_period_ends_at > statement_timestamp())
        OR (s.status = 'CANCELED' AND s.current_period_end > statement_timestamp())
      )
    ORDER BY
      CASE s.status
        WHEN 'ACTIVE' THEN 1
        WHEN 'PAST_DUE' THEN 2
        WHEN 'CANCELED' THEN 3
        ELSE 4
      END,
      s.current_period_end DESC NULLS LAST
    LIMIT 1
  ) effective ON true
  LEFT JOIN LATERAL (
    SELECT s.selected_listing_ids
    FROM public.subscriptions s
    WHERE s.profile_id = p.id
    ORDER BY s.created_at DESC, s.id DESC
    LIMIT 1
  ) selection ON true
),
ranked_listings AS (
  SELECT
    l.id,
    l.user_id,
    l.category_id,
    l.subcategory_id,
    l.title,
    l.description,
    l.price,
    l.price_type,
    l.image_url,
    l.location_city,
    l.location_state,
    l.is_active,
    l.views,
    l.created_at,
    l.updated_at,
    l.grandfathered,
    plans.active_listing_limit,
    plans.selected_listing_ids,
    count(*) FILTER (WHERE NOT l.grandfathered) OVER (
      PARTITION BY l.user_id
      ORDER BY l.updated_at DESC NULLS LAST, l.created_at DESC, l.id
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS new_listing_order
  FROM public.listings l
  JOIN plans ON plans.profile_id = l.user_id
  WHERE l.is_active
    AND EXISTS (
      SELECT 1
      FROM public.profiles profile
      WHERE profile.id = l.user_id
        AND profile.accepted_terms IS TRUE
        AND profile.is_active IS TRUE
    )
)
SELECT
  id,
  user_id,
  category_id,
  subcategory_id,
  title,
  description,
  price,
  price_type,
  image_url,
  location_city,
  location_state,
  is_active,
  views,
  created_at,
  updated_at,
  grandfathered
FROM ranked_listings
WHERE grandfathered
   OR (
     (cardinality(selected_listing_ids) = 0 AND new_listing_order <= active_listing_limit)
     OR (
       cardinality(selected_listing_ids) > 0
       AND id = ANY(selected_listing_ids)
       AND array_position(selected_listing_ids, id) <= active_listing_limit
     )
   );

REVOKE ALL ON public.profiles_public, public.listings_public FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.profiles_public, public.listings_public TO anon, authenticated;
REVOKE SELECT ON public.profiles, public.listings, public.waitlist FROM anon, PUBLIC;
GRANT SELECT ON public.profiles, public.listings TO authenticated;

REVOKE ALL ON public.cities_ranking FROM PUBLIC, anon, authenticated;

INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', false)
ON CONFLICT (id) DO UPDATE SET public = false;
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS covers_restrict_clients ON storage.objects;
CREATE POLICY covers_restrict_clients
  ON storage.objects AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (bucket_id <> 'covers')
  WITH CHECK (bucket_id <> 'covers');

REVOKE ALL ON FUNCTION public.get_effective_plan(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_effective_plan(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.save_profile_coverage(jsonb, jsonb, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_profile_coverage(jsonb, jsonb, boolean) TO authenticated;
REVOKE ALL ON FUNCTION public.reserve_profile_gallery_slot(uuid, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_profile_gallery_slot(uuid, text, integer) TO service_role;
REVOKE ALL ON FUNCTION public.replace_profile_cover(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.replace_profile_cover(uuid, text) TO service_role;
REVOKE ALL ON FUNCTION public.update_profile_gallery_image(uuid, uuid, integer, boolean)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_profile_gallery_image(uuid, uuid, integer, boolean)
  TO service_role;
REVOKE ALL ON FUNCTION public.reorder_profile_gallery_images(uuid, uuid[])
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reorder_profile_gallery_images(uuid, uuid[])
  TO service_role;
REVOKE ALL ON FUNCTION public.apply_asaas_subscription_event(text, text, text, text, text, text, text, text, text, timestamptz, timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_asaas_subscription_event(text, text, text, text, text, text, text, text, text, timestamptz, timestamptz)
  TO service_role;
REVOKE ALL ON FUNCTION public.guard_profile_entitlements() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_listing_entitlement() FROM PUBLIC, anon, authenticated;

COMMIT;
=======
ALTER TABLE public.benefits
  ADD COLUMN IF NOT EXISTS location_city TEXT;

ALTER TABLE public.benefits
  ADD COLUMN IF NOT EXISTS location_state TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS category_ids UUID[] NOT NULL DEFAULT '{}'::UUID[],
  ADD COLUMN IF NOT EXISTS subcategory_ids UUID[] NOT NULL DEFAULT '{}'::UUID[],
  ADD COLUMN IF NOT EXISTS primary_category_id UUID REFERENCES public.categories(id),
  ADD COLUMN IF NOT EXISTS primary_subcategory_id UUID REFERENCES public.subcategories(id);

DO $backfill$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'category_id'
  ) THEN
    EXECUTE $migration$
      UPDATE public.profiles
      SET category_ids = ARRAY[category_id],
          primary_category_id = COALESCE(primary_category_id, category_id)
      WHERE cardinality(category_ids) = 0
        AND category_id IS NOT NULL
    $migration$;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'subcategory_id'
  ) THEN
    EXECUTE $migration$
      UPDATE public.profiles
      SET subcategory_ids = ARRAY[subcategory_id],
          primary_subcategory_id = COALESCE(primary_subcategory_id, subcategory_id)
      WHERE cardinality(subcategory_ids) = 0
        AND subcategory_id IS NOT NULL
    $migration$;
  END IF;
END
$backfill$;

DROP POLICY IF EXISTS "waitlist_public_read" ON public.waitlist;
DROP POLICY IF EXISTS "waitlist_public_insert" ON public.waitlist;

REVOKE ALL ON TABLE public.waitlist FROM PUBLIC, anon, authenticated;
GRANT INSERT ON TABLE public.waitlist TO anon, authenticated;

CREATE POLICY "waitlist_public_insert"
  ON public.waitlist
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (accepted_terms IS TRUE);

GRANT SELECT ON TABLE public.cities_ranking TO anon, authenticated;
>>>>>>> origin/main
