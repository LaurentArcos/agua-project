-- ============================================================================
-- Agua — schéma Supabase + données de départ
-- À exécuter dans Supabase : Dashboard → SQL Editor → coller → Run.
-- ============================================================================

create table if not exists public.readings (
  id          bigint generated always as identity primary key,
  iso_date    date    not null unique,   -- date du relevé (une par jour)
  index_m3    numeric not null,          -- index compteur en m³
  conso_l     integer not null default 0,
  cout_eur    numeric not null default 0,
  vacances    boolean not null default false,
  arrosage    boolean not null default false,
  piscine     boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists readings_iso_date_idx on public.readings (iso_date);

-- ----------------------------------------------------------------------------
-- Données existantes (relevés de juin 2026).
-- "on conflict" => ré-exécutable sans créer de doublons.
-- ----------------------------------------------------------------------------
insert into public.readings
  (iso_date, index_m3, conso_l, cout_eur, vacances, arrosage, piscine)
values
  ('2026-06-01', 553.646,    0,  0.00, false, false, false),
  ('2026-06-02', 554.234,  588,  2.56, false, false, true ),
  ('2026-06-03', 554.603,  369,  1.61, false, true , false),
  ('2026-06-04', 554.663,   60,  0.26, false, false, false),
  ('2026-06-05', 555.888, 1225,  5.34, false, false, true ),
  ('2026-06-07', 556.779,  891,  3.88, false, false, false),
  ('2026-06-08', 557.154,  375,  1.64, false, false, false),
  ('2026-06-10', 557.977,  823,  3.59, false, true , false),
  ('2026-06-18', 562.950, 4973, 21.68, false, false, true ),
  ('2026-06-23', 565.215, 2265,  9.88, false, true , true )
on conflict (iso_date) do update set
  index_m3 = excluded.index_m3,
  conso_l  = excluded.conso_l,
  cout_eur = excluded.cout_eur,
  vacances = excluded.vacances,
  arrosage = excluded.arrosage,
  piscine  = excluded.piscine;

-- ----------------------------------------------------------------------------
-- RLS : activée sans policy. L'app accède à la base uniquement côté serveur
-- avec la clé secrète (service_role), qui contourne la RLS. La clé publique
-- ne peut donc rien lire/écrire.
-- ----------------------------------------------------------------------------
alter table public.readings enable row level security;
