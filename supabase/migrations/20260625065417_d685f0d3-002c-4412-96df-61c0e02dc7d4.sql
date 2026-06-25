
-- 1) Make sure Żyrardów exists
INSERT INTO public.cities (name, voivodeship, slug) VALUES
  ('Żyrardów','mazowieckie','zyrardow')
ON CONFLICT (slug) DO NOTHING;

-- 2) Districts for cities that were missing them (+ Żyrardów)
WITH c AS (SELECT id, name FROM public.cities)
INSERT INTO public.districts (city_id, name)
SELECT c.id, d.name FROM c JOIN (VALUES
  ('Żyrardów','Centrum'),
  ('Żyrardów','Stare Miasto'),
  ('Żyrardów','Teklin'),
  ('Żyrardów','Piękna'),
  ('Żyrardów','Wschód'),
  ('Żyrardów','Zachód'),
  ('Częstochowa','Śródmieście'),('Częstochowa','Stare Miasto'),('Częstochowa','Tysiąclecie'),('Częstochowa','Północ'),('Częstochowa','Raków'),
  ('Radom','Śródmieście'),('Radom','Borki'),('Radom','Ustronie'),('Radom','Gołębiów'),('Radom','Michałów'),
  ('Toruń','Stare Miasto'),('Toruń','Bydgoskie Przedmieście'),('Toruń','Chełmińskie Przedmieście'),('Toruń','Mokre'),('Toruń','Rubinkowo'),('Toruń','Na Skarpie'),
  ('Kielce','Centrum'),('Kielce','Bocianek'),('Kielce','Czarnów'),('Kielce','Ślichowice'),('Kielce','Świętokrzyskie'),
  ('Olsztyn','Śródmieście'),('Olsztyn','Jaroty'),('Olsztyn','Nagórki'),('Olsztyn','Pieczewo'),('Olsztyn','Kortowo'),
  ('Opole','Śródmieście'),('Opole','Zaodrze'),('Opole','Pasieka'),('Opole','Nowa Wieś Królewska'),('Opole','Bierkowice'),
  ('Bielsko-Biała','Centrum'),('Bielsko-Biała','Aleksandrowice'),('Bielsko-Biała','Wapienica'),('Bielsko-Biała','Złote Łany'),('Bielsko-Biała','Osiedle Beskidzkie'),
  ('Sosnowiec','Śródmieście'),('Sosnowiec','Pogoń'),('Sosnowiec','Zagórze'),('Sosnowiec','Niwka'),('Sosnowiec','Klimontów'),
  ('Gliwice','Centrum'),('Gliwice','Sośnica'),('Gliwice','Łabędy'),('Gliwice','Trynek'),('Gliwice','Sikornik'),
  ('Zabrze','Centrum'),('Zabrze','Mikulczyce'),('Zabrze','Biskupice'),('Zabrze','Helenka'),('Zabrze','Rokitnica')
) AS d(city, name) ON c.name = d.city
ON CONFLICT DO NOTHING;

-- 3) Streets for Żyrardów + extended set for Warszawa
WITH c AS (SELECT id, name FROM public.cities)
INSERT INTO public.streets (city_id, name)
SELECT c.id, s.name FROM c JOIN (VALUES
  ('Żyrardów','1 Maja'),('Żyrardów','Kościuszki'),('Żyrardów','Mireckiego'),('Żyrardów','Limanowskiego'),
  ('Żyrardów','Narutowicza'),('Żyrardów','Okrzei'),('Żyrardów','Piękna'),('Żyrardów','Sienkiewicza'),
  ('Żyrardów','Środkowa'),('Żyrardów','Waryńskiego'),('Żyrardów','Roosevelta'),('Żyrardów','Jaktorowska'),
  ('Żyrardów','Mickiewicza'),('Żyrardów','Reymonta'),('Żyrardów','Słowackiego'),('Żyrardów','Armii Krajowej'),
  ('Żyrardów','Filtrowa'),('Żyrardów','Spółdzielcza'),('Żyrardów','Konarskiego'),('Żyrardów','POW'),

  ('Warszawa','Aleja Solidarności'),('Warszawa','Aleja KEN'),('Warszawa','Aleja Wilanowska'),
  ('Warszawa','Aleja Niepodległości'),('Warszawa','Aleja Jana Pawła II'),('Warszawa','Aleja Krakowska'),
  ('Warszawa','Belwederska'),('Warszawa','Bracka'),('Warszawa','Chmielna'),('Warszawa','Czerniakowska'),
  ('Warszawa','Domaniewska'),('Warszawa','Dolna'),('Warszawa','Emilii Plater'),('Warszawa','Foksal'),
  ('Warszawa','Górczewska'),('Warszawa','Grójecka'),('Warszawa','Grzybowska'),('Warszawa','Jasna'),
  ('Warszawa','Jana Kazimierza'),('Warszawa','Kasprzaka'),('Warszawa','Kopernika'),('Warszawa','Krucza'),
  ('Warszawa','Leszno'),('Warszawa','Marszałkowska'),('Warszawa','Mokotowska'),('Warszawa','Nowowiejska'),
  ('Warszawa','Okopowa'),('Warszawa','Piękna'),('Warszawa','Polna'),('Warszawa','Prosta'),
  ('Warszawa','Puławska'),('Warszawa','Rakowiecka'),('Warszawa','Senatorska'),('Warszawa','Sienna'),
  ('Warszawa','Skierniewicka'),('Warszawa','Solec'),('Warszawa','Stawki'),('Warszawa','Tamka'),
  ('Warszawa','Towarowa'),('Warszawa','Twarda'),('Warszawa','Wałbrzyska'),('Warszawa','Wałowa'),
  ('Warszawa','Wronia'),('Warszawa','Złota'),('Warszawa','Żelazna'),('Warszawa','Żurawia')
) AS s(city, name) ON c.name = s.city
ON CONFLICT DO NOTHING;
