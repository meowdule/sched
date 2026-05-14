-- =============================================================================
-- Shift calendar — Supabase 스키마 (앱은 이 DB만 사용, GitHub JSON은 사용 안 함)
-- SQL Editor에서 위에서 아래 순서로 한 번에 실행하세요.
-- =============================================================================

-- 이전 단일 JSON 테이블(있다면 제거)
drop policy if exists "shift_calendar_select" on public.shift_calendar_state;
drop policy if exists "shift_calendar_insert" on public.shift_calendar_state;
drop policy if exists "shift_calendar_update" on public.shift_calendar_state;
drop table if exists public.shift_calendar_state cascade;

-- ---------------------------------------------------------------------------
-- 낙관적 잠금용 메타(단일 행)
-- ---------------------------------------------------------------------------
create table if not exists public.shift_calendar_meta (
  id text primary key,
  rev bigint not null default 0
);

insert into public.shift_calendar_meta (id, rev)
values ('singleton', 0)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 일정 한 건당 한 행 (앱 ShiftEvent 필드와 1:1)
-- ---------------------------------------------------------------------------
create table if not exists public.shift_events (
  id text primary key,
  type text not null,
  off_date text null,
  start_iso text null,
  end_iso text null,
  title text null,
  created_at text not null,
  updated_at text not null,
  constraint shift_events_type_ck check (type in ('DAY', 'NIGHT', 'OFF', 'CUSTOM'))
);

create index if not exists shift_events_off_date_idx
  on public.shift_events (off_date) where off_date is not null;
create index if not exists shift_events_start_idx
  on public.shift_events (start_iso) where start_iso is not null;

-- ---------------------------------------------------------------------------
-- RLS: 읽기는 anon, 쓰기는 RPC만 (직접 INSERT/DELETE 막아 유지보수 단일 경로)
-- ---------------------------------------------------------------------------
alter table public.shift_calendar_meta enable row level security;
alter table public.shift_events enable row level security;

drop policy if exists "shift_meta_select" on public.shift_calendar_meta;
create policy "shift_meta_select"
  on public.shift_calendar_meta for select
  using (true);

drop policy if exists "shift_meta_insert_singleton" on public.shift_calendar_meta;
create policy "shift_meta_insert_singleton"
  on public.shift_calendar_meta for insert
  with check (id = 'singleton');

drop policy if exists "shift_events_select" on public.shift_events;
create policy "shift_events_select"
  on public.shift_events for select
  using (true);

-- ---------------------------------------------------------------------------
-- 원자적 전체 교체 + rev 증가 (충돌 시 -1 반환)
-- ---------------------------------------------------------------------------
create or replace function public.shift_replace_events(
  p_expected_rev bigint,
  p_events jsonb
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_rev bigint;
begin
  update public.shift_calendar_meta
     set rev = rev + 1
   where id = 'singleton'
     and rev = p_expected_rev
   returning rev into v_new_rev;

  if v_new_rev is null then
    return -1;
  end if;

  -- Supabase 등에서 무조건 DELETE 금지 시 WHERE 필요
  delete from public.shift_events where true;

  insert into public.shift_events (
    id, type, off_date, start_iso, end_iso, title, created_at, updated_at
  )
  select
    ev->>'id',
    ev->>'type',
    nullif(trim(ev->>'date'), ''),
    nullif(trim(ev->>'start'), ''),
    nullif(trim(ev->>'end'), ''),
    nullif(trim(ev->>'title'), ''),
    coalesce(
      nullif(trim(ev->>'createdAt'), ''),
      nullif(trim(ev->>'created_at'), ''),
      to_char((now() at time zone 'utc'), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    ),
    coalesce(
      nullif(trim(ev->>'updatedAt'), ''),
      nullif(trim(ev->>'updated_at'), ''),
      to_char((now() at time zone 'utc'), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    )
  from jsonb_array_elements(coalesce(p_events, '[]'::jsonb)) as arr(ev)
  where ev->>'id' is not null
    and ev->>'type' is not null
    and ev->>'type' in ('DAY', 'NIGHT', 'OFF', 'CUSTOM');

  return v_new_rev;
end;
$$;

comment on function public.shift_replace_events(bigint, jsonb) is
  '일정 전체를 JSON 배열로 교체하고 rev를 1 올립니다. rev 불일치 시 -1.';

grant select on table public.shift_calendar_meta to anon, authenticated;
grant insert on table public.shift_calendar_meta to anon, authenticated;
grant select on table public.shift_events to anon, authenticated;
grant execute on function public.shift_replace_events(bigint, jsonb) to anon, authenticated;
