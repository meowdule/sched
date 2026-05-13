import { addDays, parseISO } from "date-fns";
import { writeFileSync } from "node:fs";

function seoulYmd(d) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function si(ymd, h, m) {
  return `${ymd}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00+09:00`;
}

const stamp = "2026-01-01T00:00:00.000Z";
const start = parseISO("2026-01-08T12:00:00+09:00");
const events = [];

for (let i = 0; i < 30; i++) {
  const cur = addDays(start, i);
  const ymd = seoulYmd(cur);
  const pos = i % 6;
  const id = `seed-${ymd}`;
  if (pos <= 1) {
    events.push({
      id,
      type: "DAY",
      start: si(ymd, 8, 0),
      end: si(ymd, 19, 0),
      createdAt: stamp,
      updatedAt: stamp,
    });
  } else if (pos <= 3) {
    const next = addDays(cur, 1);
    const ny = seoulYmd(next);
    events.push({
      id,
      type: "NIGHT",
      start: si(ymd, 19, 0),
      end: si(ny, 8, 0),
      createdAt: stamp,
      updatedAt: stamp,
    });
  } else {
    events.push({
      id,
      type: "OFF",
      date: ymd,
      createdAt: stamp,
      updatedAt: stamp,
    });
  }
}

writeFileSync(new URL("../data/events.json", import.meta.url), JSON.stringify(events, null, 2));
console.log("wrote", events.length, "events, last", events.at(-1)?.date);
