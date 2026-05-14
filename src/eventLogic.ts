import { addDays, parseISO } from "date-fns";
import type { EventType, ShiftEvent } from "./types";

/** 달력 셀에 표시할 유형 순서 */
const MARKER_ORDER: EventType[] = ["DAY", "NIGHT", "OFF", "CUSTOM"];

export function nowIso(): string {
  return new Date().toISOString();
}

export function uuid(): string {
  return crypto.randomUUID();
}

/** Calendar date in Seoul (YYYY-MM-DD) for an instant */
export function seoulYmd(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === "string" ? parseISO(isoOrDate) : isoOrDate;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function seoulInstant(ymd: string, h: number, m: number): string {
  return `${ymd}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00+09:00`;
}

export function labelForType(t: EventType): string {
  switch (t) {
    case "DAY":
      return "주간";
    case "NIGHT":
      return "야간";
    case "OFF":
      return "비번";
    case "CUSTOM":
      return "일정";
  }
}

/** 목록·편집기에 표시할 한 줄 제목 */
export function eventDisplayTitle(ev: ShiftEvent): string {
  if (ev.type === "CUSTOM") return ev.title?.trim() || "데이트";
  return labelForType(ev.type);
}

export function createDayShift(
  dateYmd: string,
  startIso?: string,
  endIso?: string
): ShiftEvent {
  const t = nowIso();
  return {
    id: uuid(),
    type: "DAY",
    start: startIso ?? seoulInstant(dateYmd, 8, 0),
    end: endIso ?? seoulInstant(dateYmd, 19, 0),
    createdAt: t,
    updatedAt: t,
  };
}

export function createNightShift(
  dateYmd: string,
  startIso?: string,
  endIso?: string
): ShiftEvent {
  const next = addDays(parseISO(`${dateYmd}T12:00:00+09:00`), 1);
  const nextYmd = seoulYmd(next);
  const t = nowIso();
  return {
    id: uuid(),
    type: "NIGHT",
    start: startIso ?? seoulInstant(dateYmd, 19, 0),
    end: endIso ?? seoulInstant(nextYmd, 8, 0),
    createdAt: t,
    updatedAt: t,
  };
}

export function createOff(dateYmd: string): ShiftEvent {
  const t = nowIso();
  return {
    id: uuid(),
    type: "OFF",
    date: dateYmd,
    createdAt: t,
    updatedAt: t,
  };
}

export function createCustom(
  dateYmd: string,
  title: string,
  startIso?: string,
  endIso?: string
): ShiftEvent {
  const t = nowIso();
  return {
    id: uuid(),
    type: "CUSTOM",
    title: title.trim() || "데이트",
    start: startIso ?? seoulInstant(dateYmd, 19, 0),
    end: endIso ?? seoulInstant(dateYmd, 22, 0),
    createdAt: t,
    updatedAt: t,
  };
}

export function eventTouchesDate(ev: ShiftEvent, ymd: string): boolean {
  if (ev.type === "OFF") {
    return ev.date === ymd;
  }
  if (!ev.start || !ev.end) return false;
  const s = parseISO(ev.start).getTime();
  const e = parseISO(ev.end).getTime();
  const dayStart = parseISO(`${ymd}T00:00:00+09:00`).getTime();
  const nextStart = addDays(parseISO(`${ymd}T00:00:00+09:00`), 1).getTime();
  return s < nextStart && e > dayStart;
}

export function eventsForDate(events: ShiftEvent[], ymd: string): ShiftEvent[] {
  return events.filter((e) => eventTouchesDate(e, ymd));
}

export function ymDsInMonth(year: number, month1: number): string[] {
  const list: string[] = [];
  let cur = parseISO(
    `${year}-${String(month1).padStart(2, "0")}-01T12:00:00+09:00`
  );
  while (true) {
    const y = seoulYmd(cur);
    const parts = y.split("-").map(Number);
    if (parts[1] !== month1) break;
    list.push(y);
    cur = addDays(cur, 1);
  }
  return list;
}

/** 서울 달력 날짜의 요일 (예: 목요일) */
export function seoulWeekdayLongKo(ymd: string): string {
  const d = parseISO(`${ymd}T12:00:00+09:00`);
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    weekday: "long",
  }).format(d);
}

/** 0 = Sunday … 6 = Saturday (Seoul wall date ymd) */
export function seoulWeekday(ymd: string): number {
  const d = parseISO(`${ymd}T12:00:00+09:00`);
  const wd = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    weekday: "short",
  }).format(d);
  const idx: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const key = wd.slice(0, 3);
  return idx[key] ?? 0;
}

export function calendarGridCells(
  year: number,
  month1: number
): { ymd: string; inMonth: boolean }[] {
  const pad = (n: number) => String(n).padStart(2, "0");
  const firstYmd = `${year}-${pad(month1)}-01`;
  const firstAnchor = parseISO(`${firstYmd}T12:00:00+09:00`);
  const gridStart = addDays(firstAnchor, -seoulWeekday(firstYmd));
  const cells: { ymd: string; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const cur = addDays(gridStart, i);
    const ymd = seoulYmd(cur);
    const m = Number(ymd.split("-")[1]);
    cells.push({ ymd, inMonth: m === month1 });
  }
  return cells;
}

export function datesWithEvents(
  events: ShiftEvent[],
  year: number,
  month1: number
): Set<string> {
  const set = new Set<string>();
  for (const ymd of ymDsInMonth(year, month1)) {
    if (events.some((e) => eventTouchesDate(e, ymd))) set.add(ymd);
  }
  return set;
}

/**
 * 달력 격자에 마커를 찍을지 (야간은 **시작일**에만 표시해 이틀 연속 점이 겹쳐 보이지 않게 함)
 */
export function showsCalendarMarker(ev: ShiftEvent, ymd: string): boolean {
  if (ev.type === "OFF") return ev.date === ymd;
  if (!ev.start) return false;
  return seoulYmd(parseISO(ev.start)) === ymd;
}

export function markerTypesForDay(
  events: ShiftEvent[],
  ymd: string
): EventType[] {
  const found = new Set<EventType>();
  for (const e of events) {
    if (showsCalendarMarker(e, ymd)) found.add(e.type);
  }
  return MARKER_ORDER.filter((t) => found.has(t));
}

/**
 * 빠른 추가(주간·야간·비번)와 동일한 날·같은 유형이 이미 있는지.
 * CUSTOM은 같은 날 여러 개 허용.
 */
export function isDuplicateQuickAdd(
  events: ShiftEvent[],
  ev: ShiftEvent
): boolean {
  if (ev.type === "CUSTOM") return false;
  if (ev.type === "OFF") {
    if (!ev.date) return false;
    return events.some((e) => e.type === "OFF" && e.date === ev.date);
  }
  if (!ev.start) return false;
  const anchor = seoulYmd(parseISO(ev.start));
  return events.some((e) => {
    if (e.type !== ev.type) return false;
    if (e.type !== "DAY" && e.type !== "NIGHT") return false;
    if (!e.start) return false;
    return seoulYmd(parseISO(e.start)) === anchor;
  });
}

export function hasOverlapInRange(
  events: ShiftEvent[],
  startYmd: string,
  dayCount: number
): string[] {
  const conflictDays: string[] = [];
  let cur = parseISO(`${startYmd}T12:00:00+09:00`);
  for (let i = 0; i < dayCount; i++) {
    const ymd = seoulYmd(cur);
    const touch = events.some((e) => eventTouchesDate(e, ymd));
    if (touch) conflictDays.push(ymd);
    cur = addDays(cur, 1);
  }
  return conflictDays;
}

export function buildCycleEvents(startYmd: string): ShiftEvent[] {
  const anchor = parseISO(`${startYmd}T12:00:00+09:00`);
  const y = (i: number) => seoulYmd(addDays(anchor, i));
  return [
    createDayShift(y(0)),
    createDayShift(y(1)),
    createNightShift(y(2)),
    createNightShift(y(3)),
    createOff(y(4)),
    createOff(y(5)),
  ];
}

export function sortEventsForDay(a: ShiftEvent, b: ShiftEvent): number {
  if (a.type === "OFF" && b.type !== "OFF") return 1;
  if (b.type === "OFF" && a.type !== "OFF") return -1;
  const as = a.start ? parseISO(a.start).getTime() : 0;
  const bs = b.start ? parseISO(b.start).getTime() : 0;
  return as - bs;
}

export function updateEventTimes(
  ev: ShiftEvent,
  patch: { start?: string; end?: string; date?: string; title?: string }
): ShiftEvent {
  const t = nowIso();
  if (ev.type === "OFF") {
    return {
      ...ev,
      date: patch.date ?? ev.date,
      updatedAt: t,
    };
  }
  return {
    ...ev,
    start: patch.start ?? ev.start,
    end: patch.end ?? ev.end,
    title: patch.title !== undefined ? patch.title : ev.title,
    updatedAt: t,
  };
}

/** 서울 달력 기준 M월 d일 (필요 시 연도 포함) */
function formatSeoulDateLabel(ymd: string, includeYear: boolean): string {
  const anchor = parseISO(`${ymd}T12:00:00+09:00`);
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    ...(includeYear ? { year: "numeric" } : {}),
    month: "long",
    day: "numeric",
  }).format(anchor);
}

export function formatTimeRange(ev: ShiftEvent): string {
  if (ev.type === "OFF") return "시간 없음";
  if (!ev.start || !ev.end) return "";
  const s = parseISO(ev.start);
  const e = parseISO(ev.end);
  const sy = seoulYmd(s);
  const ey = seoulYmd(e);
  const tf = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const tStart = tf.format(s);
  const tEnd = tf.format(e);

  if (sy === ey) {
    const yNow = Number(seoulYmd(new Date()).slice(0, 4));
    const yEv = Number(sy.slice(0, 4));
    const includeYear = yEv !== yNow;
    return `${formatSeoulDateLabel(sy, includeYear)} ${tStart} – ${tEnd}`;
  }

  const y1 = Number(sy.slice(0, 4));
  const y2 = Number(ey.slice(0, 4));
  const includeYear = y1 !== y2;
  return `${formatSeoulDateLabel(sy, includeYear)} ${tStart} – ${formatSeoulDateLabel(ey, includeYear)} ${tEnd}`;
}

/** 구버전 LEISURE JSON 호환 */
export function normalizeLoadedEvent(raw: unknown): ShiftEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.type === "LEISURE") {
    const v = o.leisureVariant;
    const title =
      v === "game" ? "게임" : v === "party" ? "파티" : "일정";
    const rest = { ...o } as Record<string, unknown>;
    delete rest.leisureVariant;
    return {
      ...(rest as unknown as ShiftEvent),
      type: "CUSTOM",
      title,
    };
  }
  return raw as ShiftEvent;
}
