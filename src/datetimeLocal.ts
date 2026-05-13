import { parseISO } from "date-fns";

/** datetime-local value interpreted as Asia/Seoul wall time */
export function datetimeLocalToSeoulIso(value: string): string {
  const [d, t] = value.split("T");
  const [h, m] = (t ?? "00:00").split(":");
  return `${d}T${h}:${m}:00+09:00`;
}

export function isoToDatetimeLocal(iso: string): string {
  const d = parseISO(iso);
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    f.formatToParts(d).map((x) => [x.type, x.value])
  ) as Record<string, string>;
  const mo = parts.month.padStart(2, "0");
  const da = parts.day.padStart(2, "0");
  const ho = parts.hour.padStart(2, "0");
  const mi = parts.minute.padStart(2, "0");
  return `${parts.year}-${mo}-${da}T${ho}:${mi}`;
}
