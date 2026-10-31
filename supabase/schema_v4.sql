ALTER TABLE public.benefits
  ADD COLUMN IF NOT EXISTS location_city TEXT;

ALTER TABLE public.benefits
  ADD COLUMN IF NOT EXISTS location_state TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS category_ids UUID[] NOT NULL DEFAULT '{}'::UUID[],
  ADD COLUMN IF NOT EXISTS subcategory_ids UUID[] NOT NULL DEFAULT '{}'::UUID[],
  ADD COLUMN IF NOT EXISTS primary_category_id UUID REFERENCES public.categories(id),
  ADD COLUMN IF NOT EXISTS primary_subcategory_id UUID REFERENCES public.subcategories(id);

UPDATE public.profiles
SET category_ids = ARRAY[category_id],
    primary_category_id = COALESCE(primary_category_id, category_id)
WHERE cardinality(category_ids) = 0
  AND category_id IS NOT NULL;

UPDATE public.profiles
SET subcategory_ids = ARRAY[subcategory_id],
    primary_subcategory_id = COALESCE(primary_subcategory_id, subcategory_id)
WHERE cardinality(subcategory_ids) = 0
  AND subcategory_id IS NOT NULL;

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
