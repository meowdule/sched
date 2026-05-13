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
  return "dot dot-custom";
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

const YEAR_OPTS = (() => {
  const y = new Date().getFullYear();
  const arr: number[] = [];
  for (let i = y - 3; i <= y + 5; i++) arr.push(i);
  return arr;
})();

type Props = {
  year: number;
  month: number;
  events: ShiftEvent[];
  selected: string | null;
  onSelect: (ymd: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onYearChange: (y: number) => void;
  onMonthChange: (m: number) => void;
  onJumpToday: () => void;
};

export default function CalendarMonth({
  year,
  month,
  events,
  selected,
  onSelect,
  onPrevMonth,
  onNextMonth,
  onYearChange,
  onMonthChange,
  onJumpToday,
}: Props) {
  const cells = calendarGridCells(year, month);
  const today = seoulYmd(new Date());
  const withEv = datesWithEvents(events, year, month);

  return (
    <div className="cal-card">
      <div className="cal-nav-row">
        <button type="button" className="icon-btn" onClick={onPrevMonth}>
          <ChevronLeft size={22} />
        </button>
        <div className="cal-title-block">
          <div className="month-title">
            {year}년 {month}월
          </div>
          <div className="cal-ym-pickers">
            <label className="sr-only" htmlFor="cal-year">
              연도
            </label>
            <select
              id="cal-year"
              className="cal-select"
              value={year}
              onChange={(e) => onYearChange(Number(e.target.value))}
            >
              {YEAR_OPTS.map((y) => (
                <option key={y} value={y}>
                  {y}년
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="cal-month">
              월
            </label>
            <select
              id="cal-month"
              className="cal-select"
              value={month}
              onChange={(e) => onMonthChange(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {m}월
                </option>
              ))}
            </select>
          </div>
        </div>
        <button type="button" className="icon-btn" onClick={onNextMonth}>
          <ChevronRight size={22} />
        </button>
      </div>
      <div className="cal-today-row">
        <button type="button" className="today-btn" onClick={onJumpToday}>
          오늘
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
