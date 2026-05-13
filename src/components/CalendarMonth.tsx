import { ChevronLeft, ChevronRight } from "lucide-react";
import type { EventType, ShiftEvent } from "../types";
import {
  calendarGridCells,
  markerTypesForDay,
  seoulYmd,
} from "../eventLogic";

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

function markerClass(t: EventType): string {
  switch (t) {
    case "DAY":
      return "cal-m cal-m--day";
    case "NIGHT":
      return "cal-m cal-m--night";
    case "OFF":
      return "cal-m cal-m--off";
    case "CUSTOM":
      return "cal-m cal-m--custom";
  }
}

const YEAR_OPTS = (() => {
  const y0 = Number(seoulYmd(new Date()).split("-")[0]);
  const arr: number[] = [];
  for (let i = y0 - 6; i <= y0 + 7; i++) arr.push(i);
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

  return (
    <div className="cal-card">
      <div className="cal-card-top">
        <div className="cal-fancy-selects">
          <div className="fancy-select-wrap">
            <label className="sr-only" htmlFor="cal-year">
              연도
            </label>
            <select
              id="cal-year"
              className="fancy-select"
              value={year}
              onChange={(e) => onYearChange(Number(e.target.value))}
            >
              {YEAR_OPTS.map((y) => (
                <option key={y} value={y}>
                  {y}년
                </option>
              ))}
            </select>
          </div>
          <div className="fancy-select-wrap">
            <label className="sr-only" htmlFor="cal-month">
              월
            </label>
            <select
              id="cal-month"
              className="fancy-select fancy-select--month"
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
        <button type="button" className="cal-today-pill" onClick={onJumpToday}>
          오늘
        </button>
      </div>

      <div className="cal-month-toolbar">
        <button
          type="button"
          className="icon-btn icon-btn--ghost"
          aria-label="이전 달"
          onClick={onPrevMonth}
        >
          <ChevronLeft size={22} />
        </button>
        <div className="cal-month-label">
          {year}년 {month}월
        </div>
        <button
          type="button"
          className="icon-btn icon-btn--ghost"
          aria-label="다음 달"
          onClick={onNextMonth}
        >
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
          const markers = markerTypesForDay(events, ymd);
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
              <div className="cal-markers" aria-hidden>
                {markers.map((t) => (
                  <span key={t} className={markerClass(t)} />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
