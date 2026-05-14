import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ShiftEvent } from "./types";
import { normalizeLoadedEvent } from "./eventLogic";

const META_ID = "singleton";

type ShiftEventRow = {
  id: string;
  type: string;
  off_date: string | null;
  start_iso: string | null;
  end_iso: string | null;
  title: string | null;
  created_at: string;
  updated_at: string;
};

let client: SupabaseClient | null = null;

function rowToShiftEvent(row: ShiftEventRow): ShiftEvent | null {
  return normalizeLoadedEvent({
    id: row.id,
    type: row.type,
    ...(row.off_date ? { date: row.off_date } : {}),
    ...(row.start_iso ? { start: row.start_iso } : {}),
    ...(row.end_iso ? { end: row.end_iso } : {}),
    ...(row.title ? { title: row.title } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export function getSupabaseClient(): SupabaseClient | null {
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
  const key = (
    import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  )?.trim();
  if (!url || !key) return null;
  if (!client) client = createClient(url, key);
  return client;
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseClient() !== null;
}

function requireClient(): SupabaseClient {
  const c = getSupabaseClient();
  if (!c) throw new Error("Supabase URL/anon 키가 설정되지 않았습니다.");
  return c;
}

async function ensureMetaRow(sb: SupabaseClient): Promise<void> {
  for (let i = 0; i < 5; i++) {
    const { data, error } = await sb
      .from("shift_calendar_meta")
      .select("id")
      .eq("id", META_ID)
      .maybeSingle();
    if (error) throw new Error(`Supabase 메타 읽기: ${error.message}`);
    if (data) return;
    const { error: ins } = await sb
      .from("shift_calendar_meta")
      .insert({ id: META_ID, rev: 0 });
    if (!ins) return;
    if (ins.code === "23505") continue;
    throw new Error(`Supabase 메타 초기화: ${ins.message}`);
  }
  throw new Error("Supabase: shift_calendar_meta 행을 만들 수 없습니다.");
}

export async function supabaseFetchEvents(): Promise<{
  events: ShiftEvent[];
  rev: number;
}> {
  const sb = requireClient();
  await ensureMetaRow(sb);

  const [{ data: meta, error: metaErr }, { data: rows, error: rowErr }] =
    await Promise.all([
      sb.from("shift_calendar_meta").select("rev").eq("id", META_ID).single(),
      sb
        .from("shift_events")
        .select(
          "id, type, off_date, start_iso, end_iso, title, created_at, updated_at"
        )
        .order("id", { ascending: true }),
    ]);

  if (metaErr) {
    throw new Error(`Supabase 메타: ${metaErr.message}`);
  }
  if (rowErr) {
    throw new Error(`Supabase 일정 읽기: ${rowErr.message}`);
  }

  const rev = Number(meta?.rev) || 0;
  const list = (rows ?? []) as ShiftEventRow[];
  const events = list
    .map((r) => rowToShiftEvent(r))
    .filter((e): e is ShiftEvent => e !== null);

  return { events, rev };
}

export type SaveResult =
  | { ok: true; rev: number }
  | { ok: false; conflict: true };

export async function supabaseSaveEventsIfRev(
  next: ShiftEvent[],
  expectedRev: number
): Promise<SaveResult> {
  const sb = requireClient();
  const { data, error } = await sb.rpc("shift_replace_events", {
    p_expected_rev: expectedRev,
    p_events: next,
  });
  if (error) {
    throw new Error(`Supabase 저장: ${error.message}`);
  }
  const n = typeof data === "string" ? Number(data) : Number(data);
  if (!Number.isFinite(n)) {
    throw new Error("Supabase 저장: 알 수 없는 응답");
  }
  if (n < 0) {
    return { ok: false, conflict: true };
  }
  return { ok: true, rev: n };
}
