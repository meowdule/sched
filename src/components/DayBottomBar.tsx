import { Sun, Moon, Armchair, X } from "lucide-react";
import type { ShiftEvent } from "../types";
import {
  eventDisplayTitle,
  eventsForDate,
  formatTimeRange,
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
};

export default function DayBottomBar({
  ymd,
  events,
  onClear,
  onOpenEvent,
  onQuickDay,
  onQuickNight,
  onQuickOff,
}: Props) {
  const dayEvents = [...eventsForDate(events, ymd)].sort(sortEventsForDay);

  return (
    <aside className="day-bottom-bar" aria-label={`${ymd} 일정`}>
      <div className="day-bottom-bar-head">
        <span className="day-bottom-bar-date">{ymd}</span>
        <div className="day-bottom-bar-actions">
          <button
            type="button"
            className="day-quick-btn day-quick-btn--sun"
            title="해 · 주간"
            aria-label="해, 이 날짜에 주간 추가"
            onClick={onQuickDay}
          >
            <Sun size={20} strokeWidth={2.1} />
          </button>
          <button
            type="button"
            className="day-quick-btn day-quick-btn--moon"
            title="달 · 야간"
            aria-label="달, 이 날짜에 야간 추가"
            onClick={onQuickNight}
          >
            <Moon size={20} strokeWidth={2.1} />
          </button>
          <button
            type="button"
            className="day-quick-btn day-quick-btn--rest"
            title="쉼 · 비번"
            aria-label="쉼, 이 날짜에 비번 추가"
            onClick={onQuickOff}
          >
            <Armchair size={20} strokeWidth={2.1} />
          </button>
          <button
            type="button"
            className="day-bottom-bar-close"
            aria-label="날짜 선택 해제"
            onClick={onClear}
          >
            <X size={20} />
          </button>
        </div>
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
