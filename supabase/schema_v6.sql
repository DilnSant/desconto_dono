BEGIN;

ALTER TABLE public.profile_categories
  ADD COLUMN IF NOT EXISTS service_audiences text[]
  NOT NULL DEFAULT ARRAY['commercial', 'residential']::text[];

DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profile_categories_service_audiences_check'
      AND conrelid = 'public.profile_categories'::regclass
  ) THEN
    ALTER TABLE public.profile_categories
      ADD CONSTRAINT profile_categories_service_audiences_check
      CHECK (
        cardinality(service_audiences) BETWEEN 1 AND 2
        AND service_audiences <@ ARRAY['commercial', 'residential']::text[]
      );
  END IF;
END;
$migration$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS service_hours jsonb NOT NULL DEFAULT '{}'::jsonb;

DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_service_hours_object_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_service_hours_object_check
      CHECK (jsonb_typeof(service_hours) = 'object');
  END IF;
END;
$migration$;

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
  v_primary_category_id uuid;
  v_primary_subcategory_id uuid;
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

    IF v_primary_category_id IS NULL AND active_category THEN
      v_primary_category_id := v_category_id;
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
        IF v_primary_category_id = v_category_id AND v_primary_subcategory_id IS NULL THEN
          v_primary_subcategory_id := v_subcategory_id;
        END IF;
      END IF;
    END LOOP;
  END LOOP;

  UPDATE public.profiles
  SET category_id = v_primary_category_id,
      subcategory_id = v_primary_subcategory_id,
      updated_at = statement_timestamp()
  WHERE id = v_profile_id;
END;
$$;

REVOKE ALL ON FUNCTION public.save_profile_coverage(jsonb, jsonb, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_profile_coverage(jsonb, jsonb, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.save_profile_coverage_with_audiences(
  p_service_areas jsonb,
  p_segments jsonb,
  p_declared_non_presential boolean,
  p_service_hours jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_profile_id uuid := auth.uid();
  segment_row record;
  v_category_id uuid;
  v_service_audiences text[];
BEGIN
  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(p_segments) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_segments) > 50 THEN
    RAISE EXCEPTION 'Invalid segment selection';
  END IF;
  IF p_service_hours IS NOT NULL
     AND jsonb_typeof(p_service_hours) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Service hours must be an object';
  END IF;

  FOR segment_row IN
    SELECT item.value
    FROM jsonb_array_elements(p_segments) AS item(value)
  LOOP
    IF NOT (segment_row.value ? 'serviceAudiences') THEN
      v_service_audiences := ARRAY['commercial', 'residential']::text[];
    ELSE
      IF jsonb_typeof(segment_row.value -> 'serviceAudiences') IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'Each segment must provide a valid service audience array';
      END IF;
      SELECT array_agg(DISTINCT audience ORDER BY audience)
      INTO v_service_audiences
      FROM jsonb_array_elements_text(segment_row.value -> 'serviceAudiences') AS audiences(audience);
    END IF;

    IF COALESCE(cardinality(v_service_audiences), 0) NOT BETWEEN 1 AND 2
       OR NOT (v_service_audiences <@ ARRAY['commercial', 'residential']::text[]) THEN
      RAISE EXCEPTION 'Select commercial, residential, or both for each segment';
    END IF;
  END LOOP;

  PERFORM public.save_profile_coverage(
    p_service_areas,
    p_segments,
    p_declared_non_presential
  );

  FOR segment_row IN
    SELECT item.value
    FROM jsonb_array_elements(p_segments) AS item(value)
  LOOP
    v_category_id := (segment_row.value ->> 'categoryId')::uuid;
    IF NOT (segment_row.value ? 'serviceAudiences') THEN
      v_service_audiences := ARRAY['commercial', 'residential']::text[];
    ELSE
      SELECT array_agg(DISTINCT audience ORDER BY audience)
      INTO v_service_audiences
      FROM jsonb_array_elements_text(segment_row.value -> 'serviceAudiences') AS audiences(audience);
    END IF;

    UPDATE public.profile_categories
    SET service_audiences = v_service_audiences
    WHERE profile_id = v_profile_id
      AND category_id = v_category_id;
  END LOOP;

  UPDATE public.profiles p
  SET category_ids = ARRAY(
        SELECT selected.category_id
        FROM public.profile_categories selected
        WHERE selected.profile_id = v_profile_id
        ORDER BY selected.selection_order, selected.id
      ),
      subcategory_ids = ARRAY(
        SELECT selected.subcategory_id
        FROM public.profile_categories selected_category
        JOIN public.profile_subcategories selected
          ON selected.profile_category_id = selected_category.id
        WHERE selected_category.profile_id = v_profile_id
        ORDER BY selected_category.selection_order, selected.selection_order, selected.id
      ),
      primary_category_id = p.category_id,
      primary_subcategory_id = p.subcategory_id,
      service_hours = COALESCE(p_service_hours, p.service_hours),
      updated_at = statement_timestamp()
  WHERE p.id = v_profile_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.save_profile_coverage_with_audiences(jsonb, jsonb, boolean, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_profile_coverage_with_audiences(jsonb, jsonb, boolean, jsonb)
  TO authenticated;

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
  ) AS service_area_state_codes,
  p.service_hours,
  COALESCE((
    SELECT jsonb_agg(
      jsonb_build_object(
        'category_id', visible.category_id,
        'category_name', visible.category_name,
        'service_audiences', visible.service_audiences
      ) ORDER BY visible.selection_order, visible.id
    )
    FROM (
      SELECT
        selected.id,
        selected.category_id,
        selected.selection_order,
        selected.service_audiences,
        selected_category.name AS category_name
      FROM public.profile_categories selected
      JOIN public.categories selected_category ON selected_category.id = selected.category_id
      WHERE selected.profile_id = p.id
        AND selected.is_active
      ORDER BY selected.selection_order, selected.id
      LIMIT CASE COALESCE(effective.plan_type, 'Gratuito')
          WHEN 'Profissional' THEN 3
          WHEN 'Essencial' THEN 2
          ELSE 1
        END
    ) visible
  ), '[]'::jsonb) AS service_segments
FROM public.profiles p
LEFT JOIN LATERAL (
  SELECT s.plan_type
  FROM public.subscriptions s
  WHERE s.profile_id = p.id
    AND (
      (s.status = 'ACTIVE' AND s.current_period_end > statement_timestamp())
      OR (s.status = 'PAST_DUE' AND s.grace_period_ends_at > statement_timestamp())
      OR (s.status = 'CANCELED' AND (
        s.current_period_end > statement_timestamp()
        OR s.grace_period_ends_at > statement_timestamp()
      ))
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

COMMIT;
