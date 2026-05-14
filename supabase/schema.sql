-- Supabase SQL Editor에서 한 번 실행하세요.
-- 가족/팀 전용이면 RLS를 넓게 두었습니다. anon 키만으로 읽기·쓰기 가능합니다.

create table if not exists public.shift_calendar_state (
  id text primary key,
  events jsonb not null default '[]'::jsonb,
  rev integer not null default 0
);

alter table public.shift_calendar_state enable row level security;

drop policy if exists "shift_calendar_select" on public.shift_calendar_state;
drop policy if exists "shift_calendar_insert" on public.shift_calendar_state;
drop policy if exists "shift_calendar_update" on public.shift_calendar_state;

create policy "shift_calendar_select"
  on public.shift_calendar_state for select
  using (true);

create policy "shift_calendar_insert"
  on public.shift_calendar_state for insert
  with check (true);

create policy "shift_calendar_update"
  on public.shift_calendar_state for update
  using (true)
  with check (true);

-- 앱이 사용하는 단일 행
insert into public.shift_calendar_state (id, events, rev)
values ('shared', '[]'::jsonb, 0)
on conflict (id) do nothing;
