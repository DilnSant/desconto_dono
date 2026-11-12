-- ==============================================================================
-- FIX: Resolução da ambiguidade da coluna primary_category_id em save_profile_coverage
-- Executar este script no Supabase SQL Editor
-- ==============================================================================

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
