import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ShiftEvent } from "./types";
import { normalizeLoadedEvent } from "./eventLogic";

const TABLE = "shift_calendar_state";
const ROW_ID = "shared";

let client: SupabaseClient | null = null;

function normalizeEventsFromJson(raw: unknown): ShiftEvent[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => normalizeLoadedEvent(row))
    .filter((e): e is ShiftEvent => e !== null);
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

/**
 * 단일 행을 읽거나 없으면 생성 후 반환.
 */
export async function supabaseFetchEvents(): Promise<{
  events: ShiftEvent[];
  rev: number;
}> {
  const sb = requireClient();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await sb
      .from(TABLE)
      .select("events, rev")
      .eq("id", ROW_ID)
      .maybeSingle();
    if (error) {
      throw new Error(`Supabase 읽기: ${error.message}`);
    }
    if (data) {
      return {
        events: normalizeEventsFromJson(data.events),
        rev: Number(data.rev) || 0,
      };
    }
    const { error: insErr } = await sb.from(TABLE).insert({
      id: ROW_ID,
      events: [],
      rev: 0,
    });
    if (!insErr) {
      return { events: [], rev: 0 };
    }
    if (insErr.code === "23505") {
      continue;
    }
    throw new Error(`Supabase 초기화: ${insErr.message}`);
  }
  throw new Error("Supabase: 저장 행을 준비하지 못했습니다.");
}

export type SaveResult =
  | { ok: true; rev: number }
  | { ok: false; conflict: true };

export async function supabaseSaveEventsIfRev(
  next: ShiftEvent[],
  expectedRev: number
): Promise<SaveResult> {
  const sb = requireClient();
  const nextRev = expectedRev + 1;
  const { data, error } = await sb
    .from(TABLE)
    .update({ events: next, rev: nextRev })
    .eq("id", ROW_ID)
    .eq("rev", expectedRev)
    .select("rev");
  if (error) {
    throw new Error(`Supabase 저장: ${error.message}`);
  }
  if (!data?.length) {
    return { ok: false, conflict: true };
  }
  return { ok: true, rev: Number(data[0].rev) || nextRev };
}
