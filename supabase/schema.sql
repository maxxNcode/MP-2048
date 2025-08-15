-- Profiles
create extension if not exists pgcrypto;
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  created_at timestamptz default now()
);

-- Multiplayer rooms
create table if not exists public.multiplayer_rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  creator_id uuid references public.profiles(id) on delete set null,
  joiner_id uuid references public.profiles(id) on delete set null,
  status text not null default 'waiting',
  board_state jsonb,
  current_turn uuid references public.profiles(id),
  move_history jsonb,
  winner_id uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_rooms_updated_at on public.multiplayer_rooms;
create trigger trg_rooms_updated_at
before update on public.multiplayer_rooms
for each row execute function public.set_updated_at();

-- Single-player scores
create table if not exists public.single_player_scores (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  score int,
  max_tile int,
  moves int,
  duration_seconds int,
  created_at timestamptz default now()
);

-- Multiplayer stats
create table if not exists public.multiplayer_stats (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  wins int default 0,
  losses int default 0,
  draws int default 0,
  rating numeric default 1000
);

-- Helper function to short random code
create or replace function public.short_code(len int default 6)
returns text language plpgsql as $$
declare chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
declare result text := '';
begin
  for i in 1..len loop
    result := result || substr(chars, floor(random()*length(chars))::int+1, 1);
  end loop;
  return result;
end $$;
