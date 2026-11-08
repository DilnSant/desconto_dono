-- Adds concrete service trades to the existing Prestação de Serviços category.
-- Safe to re-run: existing links and rows remain untouched.
BEGIN;

DO $migration$
DECLARE
  services_category_id uuid;
BEGIN
  SELECT id INTO services_category_id
  FROM public.categories
  WHERE slug = 'prestacao-de-servicos';

  IF services_category_id IS NULL THEN
    RAISE EXCEPTION 'Categoria prestacao-de-servicos não encontrada';
  END IF;

  INSERT INTO public.subcategories (category_id, name, slug) VALUES
    (services_category_id, 'Limpeza', 'limpeza'),
    (services_category_id, 'Eletricista', 'eletricista'),
    (services_category_id, 'Encanador', 'encanador'),
    (services_category_id, 'Pedreiro', 'pedreiro'),
    (services_category_id, 'Motorista', 'motorista'),
    (services_category_id, 'Manicure', 'manicure'),
    (services_category_id, 'Cuidadora de idosos', 'cuidadora-de-idosos'),
    (services_category_id, 'Pet sitter', 'pet-sitter'),
    (services_category_id, 'Pintor', 'pintor'),
    (services_category_id, 'Jardineiro', 'jardineiro'),
    (services_category_id, 'Montador de móveis', 'montador-de-moveis'),
    (services_category_id, 'Chaveiro', 'chaveiro'),
    (services_category_id, 'Babá', 'baba'),
    (services_category_id, 'Marido de aluguel', 'marido-de-aluguel'),
    (services_category_id, 'Técnico de ar-condicionado', 'tecnico-de-ar-condicionado'),
    (services_category_id, 'Costureira', 'costureira'),
    (services_category_id, 'Instalador de internet', 'instalador-de-internet')
  ON CONFLICT (category_id, slug) DO NOTHING;
END;
$migration$;

COMMIT;
