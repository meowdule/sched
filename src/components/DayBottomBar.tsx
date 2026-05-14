import { Sun, Moon, Armchair, Repeat, Sparkles, X } from "lucide-react";
import type { ShiftEvent } from "../types";
import {
  eventDisplayTitle,
  eventsForDate,
  formatTimeRange,
  seoulWeekdayLongKo,
  sortEventsForDay,
} from "../eventLogic";

type Props = {
  ymd: string;
  events: ShiftEvent[];
  onClear: () => void;
  onOpenEvent: (ev: ShiftEvent) => void;
  onQuickDay: () => void;
  onQuickNight: () => void;
  onQuickOff: () => void;
  onQuickCycle: () => void;
  onQuickCustom: () => void;
};

export default function DayBottomBar({
  ymd,
  events,
  onClear,
  onOpenEvent,
  onQuickDay,
  onQuickNight,
  onQuickOff,
  onQuickCycle,
  onQuickCustom,
}: Props) {
  const dayEvents = [...eventsForDate(events, ymd)].sort(sortEventsForDay);

  return (
    <aside className="day-bottom-bar" aria-label={`${ymd} 일정`}>
      <div className="day-bottom-bar-handle" aria-hidden />
      <div className="day-bottom-bar-top">
        <div className="day-bottom-bar-titleblock">
          <span className="day-bottom-bar-date-lg">{ymd}</span>
          <span className="day-bottom-bar-weekday">
            {seoulWeekdayLongKo(ymd)}
          </span>
        </div>
        <button
          type="button"
          className="day-bottom-bar-x"
          aria-label="날짜 선택 해제"
          onClick={onClear}
        >
          <X size={18} strokeWidth={2.2} />
        </button>
      </div>
      <div className="day-bottom-bar-pastel-row" role="toolbar" aria-label="빠른 추가">
        <button
          type="button"
          className="day-pastel-btn day-pastel-btn--sun"
          title="주간"
          aria-label="이 날짜에 주간 추가"
          onClick={onQuickDay}
        >
          <Sun size={22} strokeWidth={2.1} />
        </button>
        <button
          type="button"
          className="day-pastel-btn day-pastel-btn--moon"
          title="야간"
          aria-label="이 날짜에 야간 추가"
          onClick={onQuickNight}
        >
          <Moon size={22} strokeWidth={2.1} />
        </button>
        <button
          type="button"
          className="day-pastel-btn day-pastel-btn--rest"
          title="비번"
          aria-label="이 날짜에 비번 추가"
          onClick={onQuickOff}
        >
          <Armchair size={22} strokeWidth={2.1} />
        </button>
        <button
          type="button"
          className="day-pastel-btn day-pastel-btn--cycle"
          title="주기"
          aria-label="주기 적용, 시작일은 선택한 날짜"
          onClick={onQuickCycle}
        >
          <Repeat size={22} strokeWidth={2.1} />
        </button>
        <button
          type="button"
          className="day-pastel-btn day-pastel-btn--custom"
          title="일정"
          aria-label="일정 추가, 이 날짜"
          onClick={onQuickCustom}
        >
          <Sparkles size={22} strokeWidth={2.1} />
        </button>
      </div>
      <div className="day-bottom-bar-body">
        {dayEvents.length === 0 ? (
          <p className="empty-hint" style={{ padding: "12px 0" }}>
            이 날짜에 일정이 없습니다.
          </p>
        ) : (
          dayEvents.map((ev) => (
            <button
              key={ev.id}
              type="button"
              className="event-row"
              onClick={() => onOpenEvent(ev)}
            >
              <span className="event-row-title">{eventDisplayTitle(ev)}</span>
              <span className="event-row-sub">{formatTimeRange(ev)}</span>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
