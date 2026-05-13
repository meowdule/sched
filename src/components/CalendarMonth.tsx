import { ChevronLeft, ChevronRight } from "lucide-react";
import type { EventType, ShiftEvent } from "../types";
import {
  calendarGridCells,
  markerTypesForDay,
  seoulYmd,
} from "../eventLogic";
import DropdownSelect from "./DropdownSelect";

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

const YEAR_OPTIONS = YEAR_OPTS.map((y) => ({ value: y, label: `${y}년` }));
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}월`,
}));

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
        <div className="cal-ym-selects">
          <DropdownSelect
            id="cal-year"
            ariaLabel="연도 선택"
            value={year}
            options={YEAR_OPTIONS}
            onChange={onYearChange}
            variant="year"
          />
          <DropdownSelect
            id="cal-month"
            ariaLabel="월 선택"
            value={month}
            options={MONTH_OPTIONS}
            onChange={onMonthChange}
            variant="month"
          />
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
