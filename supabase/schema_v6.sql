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
