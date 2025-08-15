-- Create room
create or replace function public.create_room(creator_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare v_code text; v_id uuid;
begin
  if creator_id <> auth.uid() then
    raise exception 'not authorized';
  end if;
  -- generate unique code
  loop
    v_code := short_code(6);
    exit when not exists (select 1 from multiplayer_rooms where code = v_code);
  end loop;
  insert into multiplayer_rooms(code, creator_id, status, board_state, move_history)
  values (v_code, creator_id, 'waiting', public.create_initial_board(), '[]'::jsonb)
  returning id into v_id;
  return json_build_object('room_id', v_id, 'code', v_code);
end $$;

-- Compute a 2048 move without adding a random tile (for debugging/verification)
create or replace function public.compute_move_core(board jsonb, direction text)
returns jsonb language plpgsql as $$
declare
  b int[][] := '{{0,0,0,0},{0,0,0,0},{0,0,0,0},{0,0,0,0}}';
  nb int[][] := '{{0,0,0,0},{0,0,0,0},{0,0,0,0},{0,0,0,0}}';
  changed boolean := false;
  r int; c int;
  line int[]; compact int[]; merged int[];
  i int; k int; len int;
begin
  if direction not in ('up','down','left','right') then return null; end if;

  for r in 1..4 loop
    for c in 1..4 loop
      b[r][c] := coalesce((board -> (r-1) ->> (c-1))::int, 0);
    end loop;
  end loop;

  if direction = 'left' then
    for r in 1..4 loop
      compact := ARRAY[]::int[];
      for c in 1..4 loop
        if b[r][c] <> 0 then compact := array_append(compact, b[r][c]); end if;
      end loop;
      len := coalesce(array_length(compact,1),0);
      while len < 4 loop compact := array_append(compact, 0); len := len + 1; end loop;
      merged := compact; i := 1;
      while i <= 3 loop
        if merged[i] <> 0 and merged[i] = merged[i+1] then
          merged[i] := merged[i] * 2; merged[i+1] := 0; i := i + 2;
        else i := i + 1; end if;
      end loop;
      line := ARRAY[]::int[];
      for k in 1..4 loop if merged[k] <> 0 then line := array_append(line, merged[k]); end if; end loop;
      len := coalesce(array_length(line,1),0);
      while len < 4 loop line := array_append(line, 0); len := len + 1; end loop;
      for c in 1..4 loop nb[r][c] := line[c]; end loop;
    end loop;
  elsif direction = 'right' then
    for r in 1..4 loop
      -- build arr = [b[r][4], b[r][3], b[r][2], b[r][1]]
      compact := ARRAY[]::int[];
      if b[r][4] <> 0 then compact := array_append(compact, b[r][4]); end if;
      if b[r][3] <> 0 then compact := array_append(compact, b[r][3]); end if;
      if b[r][2] <> 0 then compact := array_append(compact, b[r][2]); end if;
      if b[r][1] <> 0 then compact := array_append(compact, b[r][1]); end if;
      len := coalesce(array_length(compact,1),0);
      while len < 4 loop compact := array_append(compact, 0); len := len + 1; end loop;
      merged := compact; i := 1;
      while i <= 3 loop
        if merged[i] <> 0 and merged[i] = merged[i+1] then
          merged[i] := merged[i] * 2; merged[i+1] := 0; i := i + 2;
        else i := i + 1; end if;
      end loop;
      line := ARRAY[]::int[];
      for k in 1..4 loop if merged[k] <> 0 then line := array_append(line, merged[k]); end if; end loop;
      len := coalesce(array_length(line,1),0);
      while len < 4 loop line := array_append(line, 0); len := len + 1; end loop;
      -- place from right: reverse back
      nb[r][4] := line[1]; nb[r][3] := line[2]; nb[r][2] := line[3]; nb[r][1] := line[4];
    end loop;
  elsif direction = 'up' then
    for c in 1..4 loop
      compact := ARRAY[]::int[];
      for r in 1..4 loop
        if b[r][c] <> 0 then compact := array_append(compact, b[r][c]); end if;
      end loop;
      len := coalesce(array_length(compact,1),0);
      while len < 4 loop compact := array_append(compact, 0); len := len + 1; end loop;
      merged := compact; i := 1;
      while i <= 3 loop
        if merged[i] <> 0 and merged[i] = merged[i+1] then
          merged[i] := merged[i] * 2; merged[i+1] := 0; i := i + 2;
        else i := i + 1; end if;
      end loop;
      line := ARRAY[]::int[];
      for k in 1..4 loop if merged[k] <> 0 then line := array_append(line, merged[k]); end if; end loop;
      len := coalesce(array_length(line,1),0);
      while len < 4 loop line := array_append(line, 0); len := len + 1; end loop;
      for r in 1..4 loop nb[r][c] := line[r]; end loop;
    end loop;
  else -- down
    for c in 1..4 loop
      compact := ARRAY[]::int[];
      for r in reverse 1..4 loop
        if b[r][c] <> 0 then compact := array_append(compact, b[r][c]); end if;
      end loop;
      len := coalesce(array_length(compact,1),0);
      while len < 4 loop compact := array_append(compact, 0); len := len + 1; end loop;
      merged := compact; i := 1;
      while i <= 3 loop
        if merged[i] <> 0 and merged[i] = merged[i+1] then
          merged[i] := merged[i] * 2; merged[i+1] := 0; i := i + 2;
        else i := i + 1; end if;
      end loop;
      line := ARRAY[]::int[];
      for k in 1..4 loop if merged[k] <> 0 then line := array_append(line, merged[k]); end if; end loop;
      len := coalesce(array_length(line,1),0);
      while len < 4 loop line := array_append(line, 0); len := len + 1; end loop;
      for r in 1..4 loop nb[5 - r][c] := line[r]; end loop;
    end loop;
  end if;

  changed := false;
  for r in 1..4 loop for c in 1..4 loop if nb[r][c] <> b[r][c] then changed := true; end if; end loop; end loop;
  if not changed then return null; end if;
  return to_jsonb(nb);
end $$;

-- Join room
create or replace function public.join_room(p_code text, p_user_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare v_room multiplayer_rooms;
begin
  if p_user_id <> auth.uid() then
    raise exception 'not authorized';
  end if;
  select * into v_room from multiplayer_rooms where code = upper(p_code);
  if not found then raise exception 'room not found'; end if;
  if v_room.status <> 'waiting' then raise exception 'room not joinable'; end if;
  if v_room.creator_id = p_user_id then raise exception 'cannot join own room'; end if;
  update multiplayer_rooms set
    joiner_id = p_user_id,
    status = 'active',
    current_turn = case when random() < 0.5 then creator_id else p_user_id end,
    board_state = public.create_initial_board(),
    updated_at = now()
  where id = v_room.id;
  return json_build_object('room_id', v_room.id);
end $$;

-- Make move (validates turn and applies 2048 rules on server)
-- Direction is one of 'up','down','left','right'
create or replace function public.make_move(p_room_id uuid, p_user_id uuid, p_direction text)
returns void language plpgsql security definer set search_path = public as $$
declare v_room multiplayer_rooms; v_board jsonb; v_next jsonb; v_hist jsonb;
begin
  if p_user_id <> auth.uid() then
    raise exception 'not authorized';
  end if;
  select * into v_room from multiplayer_rooms where id = p_room_id for update;
  if not found then raise exception 'room not found'; end if;
  if v_room.status <> 'active' then raise exception 'room not active'; end if;
  if v_room.current_turn <> p_user_id then raise exception 'not your turn'; end if;

  -- Compute next board server-side
  select public.compute_move(v_room.board_state, p_direction) into v_next;
  if v_next is null then raise exception 'illegal move'; end if;

  v_hist := coalesce(v_room.move_history, '[]'::jsonb) || jsonb_build_object(
    'player_id', p_user_id,
    'direction', p_direction,
    'beforeState', coalesce(v_room.board_state, 'null'::jsonb),
    'afterState', v_next,
    'timestamp', now()
  );

  update multiplayer_rooms set
    board_state = v_next,
    current_turn = case when p_user_id = v_room.creator_id then v_room.joiner_id else v_room.creator_id end,
    move_history = v_hist,
    updated_at = now()
  where id = p_room_id;
end $$;

-- Finish game
create or replace function public.finish_game(p_room_id uuid, p_winner uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_room multiplayer_rooms;
begin
  select * into v_room from multiplayer_rooms where id = p_room_id for update;
  if not found then raise exception 'room not found'; end if;
  if auth.uid() <> v_room.creator_id and auth.uid() <> v_room.joiner_id then
    raise exception 'not authorized';
  end if;
  update multiplayer_rooms set status = 'finished', winner_id = p_winner, updated_at = now() where id = p_room_id;
  -- update multiplayer stats
  if p_winner is not null then
    update multiplayer_stats set wins = wins + 1, rating = rating + 10 where profile_id = p_winner;
    update multiplayer_stats set losses = losses + 1, rating = greatest(rating - 10, 0) where profile_id in (v_room.creator_id, v_room.joiner_id) and profile_id <> p_winner;
    insert into multiplayer_stats(profile_id, wins, rating) select p_winner, 1, 1010 where not exists (select 1 from multiplayer_stats where profile_id = p_winner);
  else
    update multiplayer_stats set draws = draws + 1 where profile_id in (v_room.creator_id, v_room.joiner_id);
  end if;
end $$;

-- Record single player score
create or replace function public.record_single_player_score(p_user_id uuid, p_score int, p_max_tile int, p_moves int, p_duration int)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_user_id <> auth.uid() then raise exception 'not authorized'; end if;
  insert into single_player_scores(profile_id, score, max_tile, moves, duration_seconds)
  values (p_user_id, p_score, p_max_tile, p_moves, p_duration);
end $$;

-- Add a random tile (2 with 90%, 4 with 10%) to a random empty cell
create or replace function public.add_random_tile(board jsonb)
returns jsonb language plpgsql as $$
declare
  r int; c int; v int;
  empty_cells jsonb := '[]'::jsonb;
  i int := 0;
begin
  -- Build list of empty cell coordinates
  for r in 0..3 loop
    for c in 0..3 loop
      if (board -> r ->> c)::int = 0 then
        empty_cells := empty_cells || jsonb_build_array(jsonb_build_array(r,c));
      end if;
    end loop;
  end loop;
  if jsonb_array_length(empty_cells) = 0 then
    return board;
  end if;
  i := floor(random() * jsonb_array_length(empty_cells))::int;
  r := (empty_cells -> i ->> 0)::int;
  c := (empty_cells -> i ->> 1)::int;
  v := case when random() < 0.9 then 2 else 4 end;
  -- Set value at (r,c)
  board := jsonb_set(board, array[r::text, c::text], to_jsonb(v));
  return board;
end $$;

-- Create initial board with two random tiles
create or replace function public.create_initial_board()
returns jsonb language plpgsql as $$
declare
  b jsonb := '[[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]'::jsonb;
begin
  b := public.add_random_tile(b);
  b := public.add_random_tile(b);
  return b;
end $$;

-- Compute a 2048 move
create or replace function public.compute_move_core(board jsonb, direction text)
returns jsonb language plpgsql as $$
declare
  b int[][] := '{{0,0,0,0},{0,0,0,0},{0,0,0,0},{0,0,0,0}}';
  nb int[][] := '{{0,0,0,0},{0,0,0,0},{0,0,0,0},{0,0,0,0}}';
  changed boolean := false;
  r int; c int;
  line int[]; compact int[]; merged int[];
  i int; k int; len int;
begin
  if direction not in ('up','down','left','right') then return null; end if;

  -- Load jsonb into 2D int array b
  for r in 1..4 loop
    for c in 1..4 loop
      b[r][c] := coalesce((board -> (r-1) ->> (c-1))::int, 0);
    end loop;
  end loop;

  -- Helper: compress to left
  -- Build list of non-zeros in order, pad with zeros to length 4
  -- Then merge adjacent equals once, skipping the next after a merge, and compress again
  if direction = 'left' then
    for r in 1..4 loop
      compact := ARRAY[]::int[];  
      for c in 1..4 loop
        if b[r][c] <> 0 then compact := array_append(compact, b[r][c]); end if;
      end loop;
      len := coalesce(array_length(compact,1),0);
      while len < 4 loop compact := array_append(compact, 0); len := len + 1; end loop;

      -- merge pass
      merged := compact;
      i := 1;
      while i <= 3 loop
        if merged[i] <> 0 and merged[i] = merged[i+1] then
          merged[i] := merged[i] * 2;
          merged[i+1] := 0;
          i := i + 2; -- skip next
        else
          i := i + 1;
        end if;
      end loop;

      -- compress again
      line := ARRAY[]::int[];
      for k in 1..4 loop if merged[k] <> 0 then line := array_append(line, merged[k]); end if; end loop;
      len := coalesce(array_length(line,1),0);
      while len < 4 loop line := array_append(line, 0); len := len + 1; end loop;

      for c in 1..4 loop nb[r][c] := line[c]; end loop;
    end loop;
  elsif direction = 'right' then
    for r in 1..4 loop
      -- Build reversed row explicitly: [b[r][4], b[r][3], b[r][2], b[r][1]]
      compact := ARRAY[]::int[];
      if b[r][4] <> 0 then compact := array_append(compact, b[r][4]); end if;
      if b[r][3] <> 0 then compact := array_append(compact, b[r][3]); end if;
      if b[r][2] <> 0 then compact := array_append(compact, b[r][2]); end if;
      if b[r][1] <> 0 then compact := array_append(compact, b[r][1]); end if;
      len := coalesce(array_length(compact,1),0);
      while len < 4 loop compact := array_append(compact, 0); len := len + 1; end loop;

      -- merge pass (towards left within this reversed array)
      merged := compact;
      i := 1;
      while i <= 3 loop
        if merged[i] <> 0 and merged[i] = merged[i+1] then
          merged[i] := merged[i] * 2;
          merged[i+1] := 0;
          i := i + 2;
        else
          i := i + 1;
        end if;
      end loop;
      -- compress again
      line := ARRAY[]::int[];
      for k in 1..4 loop if merged[k] <> 0 then line := array_append(line, merged[k]); end if; end loop;
      len := coalesce(array_length(line,1),0);
      while len < 4 loop line := array_append(line, 0); len := len + 1; end loop;
      -- place from right: reverse back explicitly
      nb[r][4] := line[1]; nb[r][3] := line[2]; nb[r][2] := line[3]; nb[r][1] := line[4];
    end loop;
  elsif direction = 'up' then
    for c in 1..4 loop
      compact := ARRAY[]::int[];
      for r in 1..4 loop
        if b[r][c] <> 0 then compact := array_append(compact, b[r][c]); end if;
      end loop;
      len := coalesce(array_length(compact,1),0);
      while len < 4 loop compact := array_append(compact, 0); len := len + 1; end loop;

      merged := compact;
      i := 1;
      while i <= 3 loop
        if merged[i] <> 0 and merged[i] = merged[i+1] then
          merged[i] := merged[i] * 2;
          merged[i+1] := 0;
          i := i + 2;
        else
          i := i + 1;
        end if;
      end loop;

      line := ARRAY[]::int[];
      for k in 1..4 loop if merged[k] <> 0 then line := array_append(line, merged[k]); end if; end loop;
      len := coalesce(array_length(line,1),0);
      while len < 4 loop line := array_append(line, 0); len := len + 1; end loop;
      for r in 1..4 loop nb[r][c] := line[r]; end loop;
    end loop;
  else -- down
    for c in 1..4 loop
      -- reverse the column: [b[4][c], b[3][c], b[2][c], b[1][c]]
      compact := ARRAY[]::int[];
      if b[4][c] <> 0 then compact := array_append(compact, b[4][c]); end if;
      if b[3][c] <> 0 then compact := array_append(compact, b[3][c]); end if;
      if b[2][c] <> 0 then compact := array_append(compact, b[2][c]); end if;
      if b[1][c] <> 0 then compact := array_append(compact, b[1][c]); end if;
      len := coalesce(array_length(compact,1),0);
      while len < 4 loop compact := array_append(compact, 0); len := len + 1; end loop;
      merged := compact; i := 1;
      while i <= 3 loop
        if merged[i] <> 0 and merged[i] = merged[i+1] then
          merged[i] := merged[i] * 2; merged[i+1] := 0; i := i + 2;
        else i := i + 1; end if;
      end loop;
      line := ARRAY[]::int[];
      for k in 1..4 loop if merged[k] <> 0 then line := array_append(line, merged[k]); end if; end loop;
      len := coalesce(array_length(line,1),0);
      while len < 4 loop line := array_append(line, 0); len := len + 1; end loop;
      -- place from bottom: reverse back
      nb[4][c] := line[1]; nb[3][c] := line[2]; nb[2][c] := line[3]; nb[1][c] := line[4];
    end loop;
  end if;

  -- Detect change
  changed := false;
  for r in 1..4 loop for c in 1..4 loop if nb[r][c] <> b[r][c] then changed := true; end if; end loop; end loop;
  if not changed then return null; end if;

  -- Convert nb back to jsonb
  return to_jsonb(nb);
end $$;

-- Compute a 2048 move and add a random tile if the board changed
create or replace function public.compute_move(board jsonb, direction text)
returns jsonb language plpgsql as $$
declare
  core jsonb;
begin
  if direction not in ('up','down','left','right') then return null; end if;
  core := public.compute_move_core(board, direction);
  if core is null then return null; end if;
  return public.add_random_tile(core);
end $$;
