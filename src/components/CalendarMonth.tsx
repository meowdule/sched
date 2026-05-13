import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ShiftEvent } from "../types";
import {
  calendarGridCells,
  datesWithEvents,
  eventsForDate,
  seoulYmd,
} from "../eventLogic";

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

function dotClass(t: string): string {
  if (t === "DAY") return "dot dot-day";
  if (t === "NIGHT") return "dot dot-night";
  if (t === "OFF") return "dot dot-off";
  return "dot dot-leisure";
}

function typesForDay(events: ShiftEvent[], ymd: string): string[] {
  const list = eventsForDate(events, ymd);
  const order: string[] = [];
  for (const e of list) {
    if (!order.includes(e.type)) order.push(e.type);
    if (order.length >= 4) break;
  }
  return order;
}

type Props = {
  year: number;
  month: number;
  events: ShiftEvent[];
  selected: string | null;
  onSelect: (ymd: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
};

export default function CalendarMonth({
  year,
  month,
  events,
  selected,
  onSelect,
  onPrevMonth,
  onNextMonth,
}: Props) {
  const cells = calendarGridCells(year, month);
  const today = seoulYmd(new Date());
  const withEv = datesWithEvents(events, year, month);

  return (
    <div className="cal-card">
      <div className="app-header" style={{ marginBottom: 6 }}>
        <button type="button" className="icon-btn" onClick={onPrevMonth}>
          <ChevronLeft size={22} />
        </button>
        <div className="month-title">
          {year}년 {month}월
        </div>
        <button type="button" className="icon-btn" onClick={onNextMonth}>
          <ChevronRight size={22} />
        </button>
      </div>
      <div className="week-row">
        {WEEK.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="grid-row" style={{ flexWrap: "wrap" }}>
        {cells.map(({ ymd, inMonth }) => {
          const types = typesForDay(events, ymd);
          const sel = selected === ymd;
          const isToday = ymd === today;
          return (
            <button
              key={ymd}
              type="button"
              className={`day-cell ${!inMonth ? "muted" : ""} ${sel ? "selected" : ""} ${isToday && inMonth ? "today" : ""}`}
              onClick={() => onSelect(ymd)}
            >
              <span className="day-num">{Number(ymd.split("-")[2])}</span>
              <div className="dots">
                {withEv.has(ymd) &&
                  types.map((t) => (
                    <span key={t} className={dotClass(t)} aria-hidden />
                  ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
