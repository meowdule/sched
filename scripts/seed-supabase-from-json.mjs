/**
 * data/events.json 배열을 Supabase 정규화 테이블에 반영합니다.
 * shift_replace_events RPC로 전체 교체합니다(schema.sql 적용 필요).
 *
 * .env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
 * 선택 인자: JSON 파일 경로 (기본 data/events.json)
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").trim();
const key = (
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ""
).trim();

if (!url || !key) {
  console.error(
    "VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (또는 SUPABASE_*) 환경 변수가 필요합니다."
  );
  process.exit(1);
}

const jsonPath =
  process.argv[2]?.trim() || join(root, "data", "events.json");
const raw = readFileSync(jsonPath, "utf8");
const events = JSON.parse(raw);
if (!Array.isArray(events)) {
  console.error("JSON 파일은 배열이어야 합니다.");
  process.exit(1);
}

const sb = createClient(url, key);

for (let i = 0; i < 8; i++) {
  const { data: meta, error: mErr } = await sb
    .from("shift_calendar_meta")
    .select("rev")
    .eq("id", "singleton")
    .maybeSingle();
  if (mErr) {
    console.error("메타 읽기 실패:", mErr.message);
    process.exit(1);
  }
  const expectedRev = Number(meta?.rev) || 0;

  const { data, error } = await sb.rpc("shift_replace_events", {
    p_expected_rev: expectedRev,
    p_events: events,
  });
  if (error) {
    console.error("RPC 실패:", error.message);
    process.exit(1);
  }
  const n = Number(data);
  if (Number.isFinite(n) && n >= 0) {
    console.log(
      `OK: ${events.length}건을 shift_events에 반영했습니다. (rev=${n})`
    );
    process.exit(0);
  }
  await new Promise((r) => setTimeout(r, 60 + i * 30));
}

console.error("저장이 계속 충돌했습니다. 잠시 후 다시 실행하세요.");
process.exit(1);
