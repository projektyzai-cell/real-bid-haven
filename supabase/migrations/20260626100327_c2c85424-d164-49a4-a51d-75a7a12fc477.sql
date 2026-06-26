
-- Dishwasher amenity
ALTER TABLE public.rental_listings ADD COLUMN IF NOT EXISTS has_dishwasher BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.rental_requests ADD COLUMN IF NOT EXISTS wants_dishwasher BOOLEAN NOT NULL DEFAULT FALSE;

-- Seed districts for cities that have none.
WITH d(city, name) AS (VALUES
  ('Bytom','Centrum'),('Bytom','Karb'),('Bytom','Łagiewniki'),('Bytom','Miechowice'),('Bytom','Stroszek'),('Bytom','Szombierki'),
  ('Chorzów','Centrum'),('Chorzów','Batory'),('Chorzów','Klimzowiec'),('Chorzów','Chorzów II'),('Chorzów','Chorzów Stary'),
  ('Dąbrowa Górnicza','Centrum'),('Dąbrowa Górnicza','Gołonóg'),('Dąbrowa Górnicza','Mydlice'),('Dąbrowa Górnicza','Reden'),('Dąbrowa Górnicza','Strzemieszyce'),
  ('Elbląg','Śródmieście'),('Elbląg','Zatorze'),('Elbląg','Zawada'),('Elbląg','Próchnik'),('Elbląg','Zawodzie'),
  ('Gorzów Wielkopolski','Centrum'),('Gorzów Wielkopolski','Staszica'),('Gorzów Wielkopolski','Górczyn'),('Gorzów Wielkopolski','Piaski'),('Gorzów Wielkopolski','Zakanale'),
  ('Grudziądz','Śródmieście'),('Grudziądz','Lotnisko'),('Grudziądz','Strzemięcin'),('Grudziądz','Tarpno'),('Grudziądz','Mniszek'),
  ('Jastrzębie-Zdrój','Centrum'),('Jastrzębie-Zdrój','Zdrój'),('Jastrzębie-Zdrój','Szeroka'),('Jastrzębie-Zdrój','Bzie'),('Jastrzębie-Zdrój','Moszczenica'),
  ('Jaworzno','Centrum'),('Jaworzno','Szczakowa'),('Jaworzno','Jeleń'),('Jaworzno','Byczyna'),('Jaworzno','Długoszyn'),
  ('Jelenia Góra','Centrum'),('Jelenia Góra','Cieplice'),('Jelenia Góra','Sobieszów'),('Jelenia Góra','Zabobrze'),('Jelenia Góra','Jagniątków'),
  ('Kalisz','Śródmieście'),('Kalisz','Dobrzec'),('Kalisz','Tyniec'),('Kalisz','Korczak'),('Kalisz','Asnyka'),
  ('Konin','Stare Miasto'),('Konin','Nowy Konin'),('Konin','Chorzeń'),('Konin','Glinka'),('Konin','Pątnów'),
  ('Koszalin','Śródmieście'),('Koszalin','Rokosowo'),('Koszalin','Wenedów'),('Koszalin','Bukowe'),('Koszalin','Lubiatowo'),
  ('Legnica','Stare Miasto'),('Legnica','Tarninów'),('Legnica','Piekary'),('Legnica','Kartuzy'),('Legnica','Zakaczawie'),
  ('Lubin','Centrum'),('Lubin','Stary Lubin'),('Lubin','Małomice'),('Lubin','Polna'),('Lubin','Przylesie'),
  ('Mysłowice','Centrum'),('Mysłowice','Brzęczkowice'),('Mysłowice','Janów'),('Mysłowice','Wesoła'),('Mysłowice','Brzezinka'),
  ('Nowy Sącz','Centrum'),('Nowy Sącz','Helena'),('Nowy Sącz','Gołąbkowice'),('Nowy Sącz','Zawada'),('Nowy Sącz','Biegonice'),
  ('Piotrków Trybunalski','Śródmieście'),('Piotrków Trybunalski','Wierzeje'),('Piotrków Trybunalski','Bugaj'),('Piotrków Trybunalski','Bawełna'),('Piotrków Trybunalski','Krakowskie Przedmieście'),
  ('Płock','Stare Miasto'),('Płock','Podolszyce'),('Płock','Imielnica'),('Płock','Radziwie'),('Płock','Borowiczki'),
  ('Ruda Śląska','Nowy Bytom'),('Ruda Śląska','Ruda'),('Ruda Śląska','Bielszowice'),('Ruda Śląska','Halemba'),('Ruda Śląska','Kochłowice'),
  ('Rybnik','Śródmieście'),('Rybnik','Boguszowice'),('Rybnik','Niedobczyce'),('Rybnik','Chwałowice'),('Rybnik','Niewiadom'),
  ('Siedlce','Śródmieście'),('Siedlce','Nowe Siedlce'),('Siedlce','Tarcza'),('Siedlce','Roskosz'),('Siedlce','Żytnia'),
  ('Słupsk','Śródmieście'),('Słupsk','Zatorze'),('Słupsk','Westerplatte'),('Słupsk','Niepodległości'),('Słupsk','Ryczewo'),
  ('Tarnów','Centrum'),('Tarnów','Mościce'),('Tarnów','Krzyż'),('Tarnów','Klikowa'),('Tarnów','Grabówka'),
  ('Tychy','Centrum'),('Tychy','Paprocany'),('Tychy','Czułów'),('Tychy','Wilkowyje'),('Tychy','Cielmice'),
  ('Wałbrzych','Śródmieście'),('Wałbrzych','Podzamcze'),('Wałbrzych','Piaskowa Góra'),('Wałbrzych','Biały Kamień'),('Wałbrzych','Sobięcin'),
  ('Włocławek','Śródmieście'),('Włocławek','Zazamcze'),('Włocławek','Południe'),('Włocławek','Michelin'),('Włocławek','Kazimierza Wielkiego'),
  ('Zielona Góra','Centrum'),('Zielona Góra','Jędrzychów'),('Zielona Góra','Chynów'),('Zielona Góra','Raculka'),('Zielona Góra','Stary Kisielin')
)
INSERT INTO public.districts (id, name, city_id)
SELECT gen_random_uuid(), d.name, c.id
FROM d JOIN public.cities c ON c.name = d.city
WHERE NOT EXISTS (SELECT 1 FROM public.districts dx WHERE dx.city_id=c.id AND dx.name=d.name);

-- Many more Warsaw streets
WITH s(city, name) AS (VALUES
  ('Warszawa','Aleje Jerozolimskie'),('Warszawa','Aleja Niepodległości'),('Warszawa','Aleja Solidarności'),('Warszawa','Aleja Wyzwolenia'),
  ('Warszawa','Aleja Zjednoczenia'),('Warszawa','Aleja Krakowska'),('Warszawa','Aleja Stanów Zjednoczonych'),('Warszawa','Aleja Komisji Edukacji Narodowej'),
  ('Warszawa','Aleja Lotników'),('Warszawa','Aleja Wilanowska'),('Warszawa','Aleja Bohaterów Września'),('Warszawa','Aleja Reymonta'),
  ('Warszawa','Ulica Świętokrzyska'),('Warszawa','Ulica Krucza'),('Warszawa','Ulica Hoża'),('Warszawa','Ulica Wspólna'),
  ('Warszawa','Ulica Wilcza'),('Warszawa','Ulica Piękna'),('Warszawa','Ulica Mokotowska'),('Warszawa','Ulica Koszykowa'),
  ('Warszawa','Ulica Marszałkowska'),('Warszawa','Ulica Nowy Świat'),('Warszawa','Krakowskie Przedmieście'),('Warszawa','Ulica Senatorska'),
  ('Warszawa','Ulica Miodowa'),('Warszawa','Ulica Długa'),('Warszawa','Ulica Bonifraterska'),('Warszawa','Ulica Andersa'),
  ('Warszawa','Ulica Stawki'),('Warszawa','Ulica Inflancka'),('Warszawa','Ulica Słomińskiego'),('Warszawa','Ulica Międzyparkowa'),
  ('Warszawa','Ulica Targowa'),('Warszawa','Ulica Ząbkowska'),('Warszawa','Ulica Brzeska'),('Warszawa','Ulica Radzymińska'),
  ('Warszawa','Ulica Kondratowicza'),('Warszawa','Ulica Św. Wincentego'),('Warszawa','Ulica Modlińska'),('Warszawa','Ulica Marywilska'),
  ('Warszawa','Ulica Powązkowska'),('Warszawa','Ulica Krasińskiego'),('Warszawa','Ulica Broniewskiego'),('Warszawa','Ulica Włościańska'),
  ('Warszawa','Ulica Górczewska'),('Warszawa','Ulica Wolska'),('Warszawa','Ulica Kasprzaka'),('Warszawa','Ulica Prosta'),
  ('Warszawa','Ulica Towarowa'),('Warszawa','Ulica Grójecka'),('Warszawa','Ulica Banacha'),('Warszawa','Ulica Wawelska'),
  ('Warszawa','Ulica Żwirki i Wigury'),('Warszawa','Ulica Racławicka'),('Warszawa','Ulica Madalińskiego'),('Warszawa','Ulica Puławska'),
  ('Warszawa','Ulica Domaniewska'),('Warszawa','Ulica Wołoska'),('Warszawa','Ulica Bukowińska'),('Warszawa','Ulica Jana Pawła II'),
  ('Warszawa','Ulica Anielewicza'),('Warszawa','Ulica Dzielna'),('Warszawa','Ulica Smocza'),('Warszawa','Ulica Karmelicka'),
  ('Warszawa','Ulica Belwederska'),('Warszawa','Ulica Sobieskiego'),('Warszawa','Ulica Idzikowskiego'),('Warszawa','Ulica Czerniakowska'),
  ('Warszawa','Ulica Solec'),('Warszawa','Ulica Książęca'),('Warszawa','Ulica Rozbrat'),('Warszawa','Ulica Łazienkowska'),
  ('Warszawa','Ulica Goworka'),('Warszawa','Ulica Spacerowa'),('Warszawa','Ulica Klonowa'),('Warszawa','Ulica Bagatela'),
  ('Warszawa','Ulica Polna'),('Warszawa','Ulica Waryńskiego'),('Warszawa','Plac Konstytucji'),('Warszawa','Plac Trzech Krzyży'),
  ('Warszawa','Plac Bankowy'),('Warszawa','Plac Zamkowy'),('Warszawa','Plac Defilad'),('Warszawa','Plac Wilsona'),
  ('Warszawa','Ulica Mickiewicza'),('Warszawa','Ulica Słowackiego'),('Warszawa','Ulica Felińskiego'),('Warszawa','Ulica Conrada'),
  ('Warszawa','Ulica Reymonta'),('Warszawa','Ulica Wójcickiego'),('Warszawa','Ulica Marymoncka'),('Warszawa','Ulica Pułkowa'),
  ('Warszawa','Ulica Trasa Toruńska'),('Warszawa','Ulica Płochocińska'),('Warszawa','Ulica Białołęcka'),('Warszawa','Ulica Klasyków'),
  ('Warszawa','Ulica Saska'),('Warszawa','Ulica Francuska'),('Warszawa','Ulica Międzynarodowa'),('Warszawa','Ulica Egipska'),
  ('Warszawa','Ulica Grochowska'),('Warszawa','Ulica Waszyngtona'),('Warszawa','Ulica Kinowa'),('Warszawa','Ulica Ostrobramska'),
  ('Warszawa','Ulica Fieldorfa'),('Warszawa','Ulica Bora-Komorowskiego'),('Warszawa','Ulica Umińskiego'),('Warszawa','Ulica Meissnera'),
  ('Żyrardów','Aleja Partyzantów'),('Żyrardów','Aleja Niepodległości'),('Żyrardów','Aleja Wojska Polskiego'),
  ('Żyrardów','Ulica Limanowskiego'),('Żyrardów','Ulica Kościuszki'),('Żyrardów','Ulica Mickiewicza'),
  ('Żyrardów','Ulica Słowackiego'),('Żyrardów','Ulica Reymonta'),('Żyrardów','Ulica Sienkiewicza'),
  ('Żyrardów','Ulica Norwida'),('Żyrardów','Ulica Konopnickiej'),('Żyrardów','Ulica Asnyka'),
  ('Żyrardów','Ulica Lelewela'),('Żyrardów','Ulica Mireckiego'),('Żyrardów','Ulica Okrzei'),
  ('Żyrardów','Ulica Środkowa'),('Żyrardów','Ulica Wyspiańskiego'),('Żyrardów','Ulica Spółdzielcza'),
  ('Żyrardów','Ulica Targowa'),('Żyrardów','Ulica Waryńskiego'),('Żyrardów','Ulica Armii Krajowej'),
  ('Żyrardów','Ulica Roosevelta'),('Żyrardów','Ulica Krótka'),('Żyrardów','Ulica 1 Maja'),
  ('Żyrardów','Ulica Bohaterów Warszawy'),('Żyrardów','Ulica Jaktorowska'),('Żyrardów','Ulica Mostowa'),
  ('Żyrardów','Ulica Filtrowa'),('Żyrardów','Ulica Stalowa'),('Żyrardów','Ulica Parkingowa')
)
INSERT INTO public.streets (id, name, city_id)
SELECT gen_random_uuid(), s.name, c.id
FROM s JOIN public.cities c ON c.name = s.city
WHERE NOT EXISTS (SELECT 1 FROM public.streets sx WHERE sx.city_id=c.id AND lower(sx.name)=lower(s.name));
