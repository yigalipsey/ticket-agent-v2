-- SQL Script to seed countries and competitions

BEGIN;

-- 1. Ensure countries exist
INSERT INTO countries (name, name_en, slug, created_at, updated_at) 
VALUES ('אנגליה', 'England', 'england', NOW(), NOW()) 
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, name_en = EXCLUDED.name_en, updated_at = NOW();

INSERT INTO countries (name, name_en, slug, created_at, updated_at) 
VALUES ('ספרד', 'Spain', 'spain', NOW(), NOW()) 
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, name_en = EXCLUDED.name_en, updated_at = NOW();

INSERT INTO countries (name, name_en, slug, created_at, updated_at) 
VALUES ('איטליה', 'Italy', 'italy', NOW(), NOW()) 
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, name_en = EXCLUDED.name_en, updated_at = NOW();

INSERT INTO countries (name, name_en, slug, created_at, updated_at) 
VALUES ('גרמניה', 'Germany', 'germany', NOW(), NOW()) 
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, name_en = EXCLUDED.name_en, updated_at = NOW();

INSERT INTO countries (name, name_en, slug, created_at, updated_at) 
VALUES ('צרפת', 'France', 'france', NOW(), NOW()) 
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, name_en = EXCLUDED.name_en, updated_at = NOW();

INSERT INTO countries (name, name_en, slug, created_at, updated_at) 
VALUES ('אירופה', 'Europe', 'europe', NOW(), NOW()) 
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, name_en = EXCLUDED.name_en, updated_at = NOW();

-- 2. Insert/Update competitions
-- Competition: Premier League
INSERT INTO competitions (name, name_en, slug, country_id, type, is_popular, api_competition_id, created_at, updated_at)
VALUES (
  'פרמייר ליג', 
  'Premier League', 
  'premier-league', 
  (SELECT id FROM countries WHERE slug = 'england'), 
  'League', 
  true, 
  39, 
  NOW(), 
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  country_id = EXCLUDED.country_id,
  type = EXCLUDED.type,
  is_popular = EXCLUDED.is_popular,
  api_competition_id = EXCLUDED.api_competition_id,
  updated_at = NOW();

-- Competition: La Liga
INSERT INTO competitions (name, name_en, slug, country_id, type, is_popular, api_competition_id, created_at, updated_at)
VALUES (
  'לה ליגה', 
  'La Liga', 
  'la-liga', 
  (SELECT id FROM countries WHERE slug = 'spain'), 
  'League', 
  true, 
  140, 
  NOW(), 
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  country_id = EXCLUDED.country_id,
  type = EXCLUDED.type,
  is_popular = EXCLUDED.is_popular,
  api_competition_id = EXCLUDED.api_competition_id,
  updated_at = NOW();

-- Competition: Serie A
INSERT INTO competitions (name, name_en, slug, country_id, type, is_popular, api_competition_id, created_at, updated_at)
VALUES (
  'סרייה א''', 
  'Serie A', 
  'serie-a', 
  (SELECT id FROM countries WHERE slug = 'italy'), 
  'League', 
  true, 
  135, 
  NOW(), 
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  country_id = EXCLUDED.country_id,
  type = EXCLUDED.type,
  is_popular = EXCLUDED.is_popular,
  api_competition_id = EXCLUDED.api_competition_id,
  updated_at = NOW();

-- Competition: Bundesliga
INSERT INTO competitions (name, name_en, slug, country_id, type, is_popular, api_competition_id, created_at, updated_at)
VALUES (
  'בונדסליגה', 
  'Bundesliga', 
  'bundesliga', 
  (SELECT id FROM countries WHERE slug = 'germany'), 
  'League', 
  true, 
  78, 
  NOW(), 
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  country_id = EXCLUDED.country_id,
  type = EXCLUDED.type,
  is_popular = EXCLUDED.is_popular,
  api_competition_id = EXCLUDED.api_competition_id,
  updated_at = NOW();

-- Competition: Ligue 1
INSERT INTO competitions (name, name_en, slug, country_id, type, is_popular, api_competition_id, created_at, updated_at)
VALUES (
  'ליגה 1', 
  'Ligue 1', 
  'ligue-1', 
  (SELECT id FROM countries WHERE slug = 'france'), 
  'League', 
  true, 
  61, 
  NOW(), 
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  country_id = EXCLUDED.country_id,
  type = EXCLUDED.type,
  is_popular = EXCLUDED.is_popular,
  api_competition_id = EXCLUDED.api_competition_id,
  updated_at = NOW();

-- Competition: UEFA Champions League
INSERT INTO competitions (name, name_en, slug, country_id, type, is_popular, api_competition_id, created_at, updated_at)
VALUES (
  'ליגת האלופות', 
  'UEFA Champions League', 
  'champions-league', 
  (SELECT id FROM countries WHERE slug = 'europe'), 
  'Cup', 
  true, 
  2, 
  NOW(), 
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  country_id = EXCLUDED.country_id,
  type = EXCLUDED.type,
  is_popular = EXCLUDED.is_popular,
  api_competition_id = EXCLUDED.api_competition_id,
  updated_at = NOW();

-- Competition: UEFA Europa League
INSERT INTO competitions (name, name_en, slug, country_id, type, is_popular, api_competition_id, created_at, updated_at)
VALUES (
  'הליגה האירופית', 
  'UEFA Europa League', 
  'europa-league', 
  (SELECT id FROM countries WHERE slug = 'europe'), 
  'Cup', 
  true, 
  3, 
  NOW(), 
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  country_id = EXCLUDED.country_id,
  type = EXCLUDED.type,
  is_popular = EXCLUDED.is_popular,
  api_competition_id = EXCLUDED.api_competition_id,
  updated_at = NOW();

COMMIT;
