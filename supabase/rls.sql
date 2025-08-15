-- Enable RLS
alter table public.profiles enable row level security;
alter table public.multiplayer_rooms enable row level security;
alter table public.single_player_scores enable row level security;
alter table public.multiplayer_stats enable row level security;

-- Profiles: allow public select for showing usernames on leaderboards; insert/update restricted to owner
create policy "profiles_select_public" on public.profiles for select using (true);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Rooms: only participants can select; only participants can update; insert via RPC only
create policy "rooms_select_participants" on public.multiplayer_rooms for select using (
  auth.uid() = creator_id or auth.uid() = joiner_id
);
create policy "rooms_update_participants" on public.multiplayer_rooms for update using (
  auth.uid() = creator_id or auth.uid() = joiner_id
) with check (
  auth.uid() = creator_id or auth.uid() = joiner_id
);

-- Single-player scores: owner can insert/select
create policy "sps_select" on public.single_player_scores for select using (true);
create policy "sps_insert_own" on public.single_player_scores for insert with check (auth.uid() = profile_id);

-- Multiplayer stats: read all; update own via RPC
create policy "mps_select" on public.multiplayer_stats for select using (true);
create policy "mps_update_own" on public.multiplayer_stats for update using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
