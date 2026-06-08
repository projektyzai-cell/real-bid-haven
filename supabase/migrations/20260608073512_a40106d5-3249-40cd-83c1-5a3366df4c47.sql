
-- 1) cities
CREATE TABLE public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  voivodeship TEXT,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cities TO anon, authenticated;
GRANT ALL ON public.cities TO service_role;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cities_public_read" ON public.cities FOR SELECT USING (true);
CREATE INDEX cities_name_idx ON public.cities (lower(name));

-- 2) districts
CREATE TABLE public.districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (city_id, name)
);
GRANT SELECT ON public.districts TO anon, authenticated;
GRANT ALL ON public.districts TO service_role;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "districts_public_read" ON public.districts FOR SELECT USING (true);
CREATE INDEX districts_city_idx ON public.districts (city_id);

-- 3) streets
CREATE TABLE public.streets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  district_id UUID REFERENCES public.districts(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (city_id, name)
);
GRANT SELECT ON public.streets TO anon, authenticated;
GRANT ALL ON public.streets TO service_role;
ALTER TABLE public.streets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "streets_public_read" ON public.streets FOR SELECT USING (true);
CREATE INDEX streets_city_idx ON public.streets (city_id);
CREATE INDEX streets_district_idx ON public.streets (district_id);
CREATE INDEX streets_name_idx ON public.streets (lower(name));

-- 4) Seed: 10 miast
INSERT INTO public.cities (name, voivodeship, slug) VALUES
  ('Warszawa', 'mazowieckie', 'warszawa'),
  ('Kraków', 'małopolskie', 'krakow'),
  ('Łódź', 'łódzkie', 'lodz'),
  ('Wrocław', 'dolnośląskie', 'wroclaw'),
  ('Poznań', 'wielkopolskie', 'poznan'),
  ('Gdańsk', 'pomorskie', 'gdansk'),
  ('Szczecin', 'zachodniopomorskie', 'szczecin'),
  ('Bydgoszcz', 'kujawsko-pomorskie', 'bydgoszcz'),
  ('Lublin', 'lubelskie', 'lublin'),
  ('Katowice', 'śląskie', 'katowice');

-- 5) Seed: dzielnice (kilka popularnych dla każdego miasta)
INSERT INTO public.districts (city_id, name)
SELECT c.id, d.name FROM public.cities c
JOIN (VALUES
  ('warszawa','Śródmieście'),('warszawa','Mokotów'),('warszawa','Wola'),('warszawa','Ursynów'),('warszawa','Praga-Południe'),('warszawa','Bemowo'),('warszawa','Bielany'),('warszawa','Ochota'),
  ('krakow','Stare Miasto'),('krakow','Kazimierz'),('krakow','Podgórze'),('krakow','Krowodrza'),('krakow','Nowa Huta'),('krakow','Bronowice'),
  ('lodz','Śródmieście'),('lodz','Bałuty'),('lodz','Polesie'),('lodz','Widzew'),('lodz','Górna'),
  ('wroclaw','Stare Miasto'),('wroclaw','Krzyki'),('wroclaw','Śródmieście'),('wroclaw','Fabryczna'),('wroclaw','Psie Pole'),
  ('poznan','Stare Miasto'),('poznan','Jeżyce'),('poznan','Grunwald'),('poznan','Wilda'),('poznan','Nowe Miasto'),
  ('gdansk','Śródmieście'),('gdansk','Wrzeszcz'),('gdansk','Oliwa'),('gdansk','Przymorze'),('gdansk','Zaspa'),
  ('szczecin','Śródmieście'),('szczecin','Pogodno'),('szczecin','Niebuszewo'),('szczecin','Pomorzany'),
  ('bydgoszcz','Śródmieście'),('bydgoszcz','Fordon'),('bydgoszcz','Bartodzieje'),('bydgoszcz','Szwederowo'),
  ('lublin','Śródmieście'),('lublin','LSM'),('lublin','Czuby'),('lublin','Bronowice'),('lublin','Czechów'),
  ('katowice','Śródmieście'),('katowice','Ligota'),('katowice','Brynów'),('katowice','Bogucice'),('katowice','Załęże')
) AS d(slug, name) ON c.slug = d.slug;

-- 6) Seed: kilka ulic w największych miastach (przykładowe; user może rozszerzać)
INSERT INTO public.streets (city_id, name)
SELECT c.id, s.name FROM public.cities c
JOIN (VALUES
  ('warszawa','Marszałkowska'),('warszawa','Aleje Jerozolimskie'),('warszawa','Puławska'),('warszawa','Nowy Świat'),('warszawa','Krakowskie Przedmieście'),('warszawa','Wilcza'),('warszawa','Hoża'),('warszawa','Świętokrzyska'),
  ('krakow','Floriańska'),('krakow','Grodzka'),('krakow','Karmelicka'),('krakow','Dietla'),('krakow','Aleja Pokoju'),('krakow','Kalwaryjska'),
  ('lodz','Piotrkowska'),('lodz','Aleja Mickiewicza'),('lodz','Narutowicza'),('lodz','Zachodnia'),
  ('wroclaw','Świdnicka'),('wroclaw','Powstańców Śląskich'),('wroclaw','Legnicka'),('wroclaw','Grabiszyńska'),
  ('poznan','Święty Marcin'),('poznan','Półwiejska'),('poznan','Głogowska'),('poznan','Dąbrowskiego'),
  ('gdansk','Długa'),('gdansk','Grunwaldzka'),('gdansk','Słowackiego'),('gdansk','Hallera'),
  ('szczecin','Aleja Wyzwolenia'),('szczecin','Krzywoustego'),('szczecin','Mickiewicza'),
  ('bydgoszcz','Gdańska'),('bydgoszcz','Fordońska'),('bydgoszcz','Jagiellońska'),
  ('lublin','Krakowskie Przedmieście'),('lublin','Lipowa'),('lublin','Aleje Racławickie'),
  ('katowice','Mariacka'),('katowice','3 Maja'),('katowice','Kościuszki')
) AS s(slug, name) ON c.slug = s.slug;
