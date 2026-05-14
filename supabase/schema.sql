-- =============================================================================
-- Shift calendar — Supabase 스키마 (최신 전체)
--
-- SQL Editor에서 통째로 실행하세요.
-- ⚠ 재실행 시 shift_events·메타가 드롭되어 일정 데이터는 모두 사라집니다.
--    (초기 구축·스키마 갱신용. 운영 중이면 백업 후 실행)
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 0) 이전 객체 제거 (의존 순서: RPC → 일정 테이블 → 메타 → 레거시 JSON 테이블)
-- ---------------------------------------------------------------------------
drop function if exists public.shift_replace_events(bigint, jsonb);

drop table if exists public.shift_events cascade;
drop table if exists public.shift_calendar_meta cascade;

-- 레거시 JSON 한 줄 테이블 (있으면 정책·테이블 함께 제거)
drop table if exists public.shift_calendar_state cascade;

-- ---------------------------------------------------------------------------
-- 1) 낙관적 잠금 메타 (단일 행 id = singleton)
-- ---------------------------------------------------------------------------
create table public.shift_calendar_meta (
  id text primary key,
  rev bigint not null default 0
);

insert into public.shift_calendar_meta (id, rev)
values ('singleton', 0);

-- ---------------------------------------------------------------------------
-- 2) 일정 한 건 = 한 행 (앱 ShiftEvent 와 1:1)
-- ---------------------------------------------------------------------------
create table public.shift_events (
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

create index shift_events_off_date_idx
  on public.shift_events (off_date)
  where off_date is not null;

create index shift_events_start_idx
  on public.shift_events (start_iso)
  where start_iso is not null;

-- ---------------------------------------------------------------------------
-- 3) RLS — 읽기만 anon; 일정 변경은 RPC 한 경로
-- ---------------------------------------------------------------------------
alter table public.shift_calendar_meta enable row level security;
alter table public.shift_events enable row level security;

create policy "shift_meta_select"
  on public.shift_calendar_meta for select
  using (true);

create policy "shift_meta_insert_singleton"
  on public.shift_calendar_meta for insert
  with check (id = 'singleton');

create policy "shift_events_select"
  on public.shift_events for select
  using (true);

-- ---------------------------------------------------------------------------
-- 4) 원자적 전체 교체 + rev 증가 (rev 불일치 시 -1)
--    DELETE 에 WHERE true — Supabase “DELETE requires WHERE” 가드 대응
-- ---------------------------------------------------------------------------
create function public.shift_replace_events(
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

-- ---------------------------------------------------------------------------
-- 5) 권한 (anon / authenticated — 가족·팀용 공개 anon 키 전제)
-- ---------------------------------------------------------------------------
grant select on table public.shift_calendar_meta to anon, authenticated;
grant insert on table public.shift_calendar_meta to anon, authenticated;
grant select on table public.shift_events to anon, authenticated;
grant execute on function public.shift_replace_events(bigint, jsonb) to anon, authenticated;

commit;
