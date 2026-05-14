/**
 * GitHub용 data/events.json 내용을 Supabase shift_calendar_state 한 행으로 넣습니다.
 * 실행 전: supabase/schema.sql 적용, .env에 VITE_SUPABASE_URL·VITE_SUPABASE_ANON_KEY 설정.
 * 이후 레포의 events.json은 빈 배열로 두고(Supabase만 진실), GitHub 모드는 빈 달력이 됩니다.
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
  console.error("data/events.json은 JSON 배열이어야 합니다.");
  process.exit(1);
}

const sb = createClient(url, key);
const { error } = await sb.from("shift_calendar_state").upsert(
  { id: "shared", events, rev: 0 },
  { onConflict: "id" }
);

if (error) {
  console.error("Supabase upsert 실패:", error.message);
  process.exit(1);
}

console.log(`OK: ${events.length}건을 shift_calendar_state(id=shared)에 반영했습니다.`);
