-- =========================================================
-- MAÎTRISE — Schéma Supabase
-- À exécuter dans Supabase > SQL Editor > New query > Run
-- =========================================================

-- Table des profils, liée aux comptes Supabase Auth (auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  pseudo text unique not null,
  poids numeric not null,
  objectifs text[] not null default '{}',
  lieu_pref text default 'maison',
  equipements text[] not null default '{}',
  points int not null default 0,
  total_validations int not null default 0,
  done_today jsonb not null default '{}',
  done_today_date text default '',
  daily_date text default '',
  daily_exercises text[] not null default '{}',
  cooldowns jsonb not null default '{}',
  created_at timestamp with time zone default now()
);

-- Active la sécurité au niveau des lignes (RLS)
alter table profiles enable row level security;

-- Tout le monde peut lire les profils (nécessaire pour le classement public)
create policy "Lecture publique pour le classement"
on profiles for select
using (true);

-- Chacun ne peut créer que sa propre ligne, au moment de l'inscription
create policy "Un utilisateur crée son propre profil"
on profiles for insert
with check (auth.uid() = id);

-- Chacun ne peut modifier que sa propre ligne
create policy "Un utilisateur modifie son propre profil"
on profiles for update
using (auth.uid() = id);
