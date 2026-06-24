alter table public.rental_listings
  add column if not exists has_parking_space boolean not null default false,
  add column if not exists has_washing_machine boolean not null default false;

alter table public.rental_requests
  add column if not exists wants_parking_space boolean not null default false,
  add column if not exists wants_washing_machine boolean not null default false;