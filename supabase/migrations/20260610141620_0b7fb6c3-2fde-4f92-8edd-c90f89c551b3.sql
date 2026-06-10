
-- =================== PROFILES expansion ===================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS identity_source TEXT,           -- 'mobywatel' | 'bank_node' | 'ocr_passport' | 'manual'
  ADD COLUMN IF NOT EXISTS identity_doc_url TEXT,          -- skan paszportu/dowodu (storage)
  ADD COLUMN IF NOT EXISTS employment_type TEXT,           -- 'uop' | 'b2b' | 'zlecenie' | 'kontrakt' | 'inne'
  ADD COLUMN IF NOT EXISTS employer_name TEXT,
  ADD COLUMN IF NOT EXISTS employment_contract_url TEXT,
  ADD COLUMN IF NOT EXISTS employment_contract_until DATE,
  ADD COLUMN IF NOT EXISTS bank_statement_urls TEXT[],
  ADD COLUMN IF NOT EXISTS monthly_income_net NUMERIC,
  ADD COLUMN IF NOT EXISTS income_verification_status TEXT DEFAULT 'pending', -- pending|verified|rejected
  ADD COLUMN IF NOT EXISTS identity_verification_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS social_facebook_url TEXT,
  ADD COLUMN IF NOT EXISTS instagram_account_created_at DATE,
  ADD COLUMN IF NOT EXISTS verified_employer BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verified_facebook BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verified_instagram BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS accepts_notarial_lease BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS has_tenant_insurance BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS willing_tenant_insurance BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS has_completed_internal_staysafe_lease BOOLEAN NOT NULL DEFAULT FALSE;

-- =================== RENTAL REQUESTS expansion ===================
ALTER TABLE public.rental_requests
  ADD COLUMN IF NOT EXISTS children_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS search_mode TEXT NOT NULL DEFAULT 'district', -- 'district' | 'address' | 'map'
  ADD COLUMN IF NOT EXISTS search_street TEXT,
  ADD COLUMN IF NOT EXISTS search_lat NUMERIC,
  ADD COLUMN IF NOT EXISTS search_lng NUMERIC,
  ADD COLUMN IF NOT EXISTS search_radius_km NUMERIC;

-- Map old has_children -> children_count when needed (keep both)
UPDATE public.rental_requests SET children_count = 1
  WHERE has_children = TRUE AND children_count = 0;

-- =================== LEASE HISTORY ENTRIES ===================
CREATE TABLE IF NOT EXISTS public.lease_history_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date_from DATE NOT NULL,
  date_to DATE,
  property_kind TEXT NOT NULL,            -- 'mieszkanie' | 'pokoj' | 'dom'
  city TEXT,
  address TEXT,
  prev_landlord_name TEXT,
  prev_landlord_phone TEXT,
  references_available BOOLEAN NOT NULL DEFAULT FALSE,
  contract_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lease_history_entries TO authenticated;
GRANT ALL ON public.lease_history_entries TO service_role;

ALTER TABLE public.lease_history_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage own lease history"
  ON public.lease_history_entries FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all lease history"
  ON public.lease_history_entries FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.touch_lease_history()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_touch_lease_history ON public.lease_history_entries;
CREATE TRIGGER trg_touch_lease_history BEFORE UPDATE ON public.lease_history_entries
  FOR EACH ROW EXECUTE FUNCTION public.touch_lease_history();

-- =================== STORAGE RLS for passport-docs ===================
-- bucket is created via storage tool separately
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND policyname='passport_docs_owner_all') THEN
    EXECUTE $p$CREATE POLICY "passport_docs_owner_all" ON storage.objects FOR ALL
      USING (bucket_id = 'passport-docs' AND auth.uid()::text = (storage.foldername(name))[1])
      WITH CHECK (bucket_id = 'passport-docs' AND auth.uid()::text = (storage.foldername(name))[1])$p$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND policyname='passport_docs_admin_read') THEN
    EXECUTE $p$CREATE POLICY "passport_docs_admin_read" ON storage.objects FOR SELECT
      USING (bucket_id = 'passport-docs' AND public.has_role(auth.uid(), 'admin'))$p$;
  END IF;
END $$;

-- =================== CITIES SEED (50) ===================
ALTER TABLE public.cities ADD CONSTRAINT cities_name_unique UNIQUE (name);

INSERT INTO public.cities (name, voivodeship, slug) VALUES
  ('Warszawa','mazowieckie','warszawa'),
  ('Kraków','małopolskie','krakow'),
  ('Łódź','łódzkie','lodz'),
  ('Wrocław','dolnośląskie','wroclaw'),
  ('Poznań','wielkopolskie','poznan'),
  ('Gdańsk','pomorskie','gdansk'),
  ('Szczecin','zachodniopomorskie','szczecin'),
  ('Bydgoszcz','kujawsko-pomorskie','bydgoszcz'),
  ('Lublin','lubelskie','lublin'),
  ('Katowice','śląskie','katowice'),
  ('Białystok','podlaskie','bialystok'),
  ('Gdynia','pomorskie','gdynia'),
  ('Częstochowa','śląskie','czestochowa'),
  ('Radom','mazowieckie','radom'),
  ('Sosnowiec','śląskie','sosnowiec'),
  ('Toruń','kujawsko-pomorskie','torun'),
  ('Kielce','świętokrzyskie','kielce'),
  ('Rzeszów','podkarpackie','rzeszow'),
  ('Gliwice','śląskie','gliwice'),
  ('Zabrze','śląskie','zabrze'),
  ('Olsztyn','warmińsko-mazurskie','olsztyn'),
  ('Bielsko-Biała','śląskie','bielsko-biala'),
  ('Bytom','śląskie','bytom'),
  ('Zielona Góra','lubuskie','zielona-gora'),
  ('Rybnik','śląskie','rybnik'),
  ('Ruda Śląska','śląskie','ruda-slaska'),
  ('Tychy','śląskie','tychy'),
  ('Opole','opolskie','opole'),
  ('Gorzów Wielkopolski','lubuskie','gorzow-wielkopolski'),
  ('Dąbrowa Górnicza','śląskie','dabrowa-gornicza'),
  ('Płock','mazowieckie','plock'),
  ('Elbląg','warmińsko-mazurskie','elblag'),
  ('Wałbrzych','dolnośląskie','walbrzych'),
  ('Włocławek','kujawsko-pomorskie','wloclawek'),
  ('Tarnów','małopolskie','tarnow'),
  ('Chorzów','śląskie','chorzow'),
  ('Koszalin','zachodniopomorskie','koszalin'),
  ('Kalisz','wielkopolskie','kalisz'),
  ('Legnica','dolnośląskie','legnica'),
  ('Grudziądz','kujawsko-pomorskie','grudziadz'),
  ('Słupsk','pomorskie','slupsk'),
  ('Jaworzno','śląskie','jaworzno'),
  ('Jastrzębie-Zdrój','śląskie','jastrzebie-zdroj'),
  ('Nowy Sącz','małopolskie','nowy-sacz'),
  ('Jelenia Góra','dolnośląskie','jelenia-gora'),
  ('Siedlce','mazowieckie','siedlce'),
  ('Mysłowice','śląskie','myslowice'),
  ('Konin','wielkopolskie','konin'),
  ('Piotrków Trybunalski','łódzkie','piotrkow-trybunalski'),
  ('Lubin','dolnośląskie','lubin')
ON CONFLICT (name) DO NOTHING;

-- =================== DISTRICTS SEED (major cities) ===================
WITH c AS (SELECT id, name FROM public.cities)
INSERT INTO public.districts (city_id, name)
SELECT c.id, d.name FROM c JOIN (VALUES
  ('Warszawa','Śródmieście'),('Warszawa','Mokotów'),('Warszawa','Praga-Północ'),('Warszawa','Praga-Południe'),
  ('Warszawa','Wola'),('Warszawa','Ochota'),('Warszawa','Żoliborz'),('Warszawa','Bielany'),('Warszawa','Bemowo'),
  ('Warszawa','Ursynów'),('Warszawa','Wilanów'),('Warszawa','Targówek'),('Warszawa','Białołęka'),('Warszawa','Wawer'),
  ('Warszawa','Ursus'),('Warszawa','Włochy'),('Warszawa','Rembertów'),('Warszawa','Wesoła'),
  ('Kraków','Stare Miasto'),('Kraków','Grzegórzki'),('Kraków','Prądnik Czerwony'),('Kraków','Prądnik Biały'),
  ('Kraków','Krowodrza'),('Kraków','Bronowice'),('Kraków','Zwierzyniec'),('Kraków','Dębniki'),('Kraków','Łagiewniki-Borek Fałęcki'),
  ('Kraków','Swoszowice'),('Kraków','Podgórze Duchackie'),('Kraków','Bieżanów-Prokocim'),('Kraków','Podgórze'),
  ('Kraków','Czyżyny'),('Kraków','Mistrzejowice'),('Kraków','Bieńczyce'),('Kraków','Wzgórza Krzesławickie'),('Kraków','Nowa Huta'),
  ('Łódź','Bałuty'),('Łódź','Górna'),('Łódź','Polesie'),('Łódź','Śródmieście'),('Łódź','Widzew'),
  ('Wrocław','Stare Miasto'),('Wrocław','Śródmieście'),('Wrocław','Krzyki'),('Wrocław','Fabryczna'),('Wrocław','Psie Pole'),
  ('Poznań','Stare Miasto'),('Poznań','Nowe Miasto'),('Poznań','Grunwald'),('Poznań','Jeżyce'),('Poznań','Wilda'),
  ('Gdańsk','Śródmieście'),('Gdańsk','Wrzeszcz Górny'),('Gdańsk','Wrzeszcz Dolny'),('Gdańsk','Oliwa'),
  ('Gdańsk','Przymorze Wielkie'),('Gdańsk','Zaspa'),('Gdańsk','Brzeźno'),('Gdańsk','Nowy Port'),('Gdańsk','Stogi'),
  ('Gdańsk','Chełm'),('Gdańsk','Orunia'),('Gdańsk','Jasień'),('Gdańsk','Piecki-Migowo'),('Gdańsk','Suchanino'),
  ('Szczecin','Śródmieście'),('Szczecin','Północ'),('Szczecin','Zachód'),('Szczecin','Prawobrzeże'),
  ('Bydgoszcz','Śródmieście'),('Bydgoszcz','Fordon'),('Bydgoszcz','Bartodzieje'),('Bydgoszcz','Szwederowo'),('Bydgoszcz','Wyżyny'),
  ('Lublin','Śródmieście'),('Lublin','LSM'),('Lublin','Czuby'),('Lublin','Wieniawa'),('Lublin','Czechów'),
  ('Katowice','Śródmieście'),('Katowice','Ligota-Panewniki'),('Katowice','Bogucice'),('Katowice','Brynów'),
  ('Katowice','Nikiszowiec'),('Katowice','Giszowiec'),('Katowice','Załęże'),
  ('Gdynia','Śródmieście'),('Gdynia','Wzgórze Św. Maksymiliana'),('Gdynia','Działki Leśne'),('Gdynia','Kamienna Góra'),
  ('Gdynia','Orłowo'),('Gdynia','Redłowo'),('Gdynia','Witomino'),('Gdynia','Karwiny'),('Gdynia','Dąbrowa'),
  ('Białystok','Centrum'),('Białystok','Antoniuk'),('Białystok','Wygoda'),('Białystok','Białostoczek'),('Białystok','Piasta'),
  ('Rzeszów','Śródmieście'),('Rzeszów','Nowe Miasto'),('Rzeszów','Baranówka'),('Rzeszów','Krakowska-Południe')
) AS d(city, name) ON c.name = d.city
ON CONFLICT DO NOTHING;
