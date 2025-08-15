# MP 2048 (React + Vite + TS + Tailwind + Supabase)

Turn-based multiplayer and single-player 2048 built with React + Vite + TypeScript, styled with Tailwind, and powered by Supabase Auth, Postgres, Realtime, and RPCs.

## Tech Stack
- React 18 + Vite + TypeScript
- TailwindCSS
- Supabase: Auth, Postgres (RLS), Realtime, RPC

## Project Structure
- `index.html`: Vite entry
- `src/` front-end
  - `main.tsx`, `App.tsx`, `index.css`
  - `context/AuthProvider.tsx`
  - `lib/supabaseClient.ts`, `lib/username.ts`
  - `pages/`: `AuthPage.tsx`, `LobbyPage.tsx`, `GamePage.tsx`, `LeaderboardPage.tsx`, `ProfilePage.tsx`
  - `ui/`: `GameBoard.tsx`, `Tile.tsx`, `ScorePanel.tsx`, `MoveButtons.tsx`, `TurnIndicator.tsx`, `RealtimeStatus.tsx`, `RoomCodeDisplay.tsx`
  - `util/game.ts`: 2048 board logic
- `supabase/` SQL
  - `schema.sql`, `rls.sql`, `rpc.sql`

## Setup

### 1) Install dependencies
```
npm install
```

### 2) Create a Supabase project
- Go to https://supabase.com/ and create a new project.
- Copy your Project URL and anonymous (public) API key from: Project Settings → API.

### 3) Configure environment variables
- Copy `.env.example` to `.env` and fill with your values:
```
VITE_SUPABASE_URL=https://YOUR-REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

### 4) Apply database schema, RLS, and RPCs
- Open Supabase Dashboard → SQL Editor and run these files in order:
  1. `supabase/schema.sql`
  2. `supabase/rls.sql`
  3. `supabase/rpc.sql`

### 5) Enable Realtime
- Database → Replication → configure Realtime for table: `public.multiplayer_rooms`.
- Turn on Row Level changes for INSERT, UPDATE.

### 6) Storage (avatars)
- Storage → Create a bucket named `avatars`.
- Set it to Public (or add appropriate RLS policies if Private). This app expects public URLs to be readable.

### 7) Auth
- Authentication → Providers: ensure Email provider is enabled.
- Optional: set site URL for email links if you use email confirmations.

### 8) Start the dev server
```
npm run dev
```

#### Access on your phone (same Wi‑Fi)
Run Vite with LAN exposure and open the Network URL on your phone:
```
npm run dev -- --host
```
Vite prints a Network URL like `http://192.168.1.23:5173/`. Use that on your phone. Allow Windows Firewall prompts.

## Features
- Auth (email/password). On first login, profile row is created with a random username.
- Lobby: create a room (short join code) or join via code; single-player quick start.
- Multiplayer: turn-based; only current player can move. Board state, turn, and move history persisted. Realtime sync between both clients.
- Single-player: local board; final score recorded via RPC.
- Leaderboards: single-player top scores; multiplayer ranking.

## Security & Data Integrity
- RLS:
  - `profiles`: public readable (to show usernames), owner can insert/update.
  - `multiplayer_rooms`: only participants can select/update.
  - `single_player_scores`: public read; owner insert.
  - `multiplayer_stats`: public read; owner update via RPC.
- Server-side RPC validates state changes and enforces turn order. Note: `compute_move` is a minimal placeholder; for production, replace with a full, deterministic server-side 2048 move/merge implementation (or accept a client-proposed next board and verify that the move changes state + turn ownership).

## Test Plan (Concise)
- Auth
  - Create account; verify a username appears under Profile.
- Create & Join
  - User A creates a room; note join code.
  - User B joins with code; room becomes `active`.
- Turn-taking
  - Only the current player’s Move buttons should apply moves.
  - After a move, the other client shows updated board immediately and turn toggles.
- Realtime
  - Close and reopen a client; it should load `board_state` and `current_turn`.
- Single-player scoring
  - Finish a single-player game; verify a row appears in `single_player_scores` and Leaderboard shows it.
- Leaderboards
  - Finish multiplayer with `finish_game`; `multiplayer_stats` updates and Leaderboard shows change.
- RLS
  - Attempt to query/update another user’s profile or a room you are not in; should fail.

## Notes / Future Work
- Implement full server-side 2048 move computation in `compute_move` for stricter anti-cheat.
- Add rematch flow and room abandonment/timeout rules.
- Add swipe controls and keyboard shortcuts.
- Paginated leaderboards with filters.

## Deploy
- Vercel/Netlify: build with `npm run build`, serve `dist/`. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in project env vars.
- Supabase: apply the same SQL migrations (`schema.sql`, `rls.sql`, `rpc.sql`), enable Realtime on `public.multiplayer_rooms`, and create the `avatars` bucket.

## Troubleshooting
- Realtime not updating: confirm Realtime is enabled for `public.multiplayer_rooms` and policies allow updates for participants.
- Avatar not loading: ensure the `avatars` bucket exists and is public; check that `avatar_url` is persisted on the user via `auth.updateUser`.
- 403/Policy errors: re-run `supabase/rls.sql` and verify RLS policies match your needs.
- Mobile can’t connect to dev server: run with `--host`, use your LAN IP, and allow firewall for Private networks.
