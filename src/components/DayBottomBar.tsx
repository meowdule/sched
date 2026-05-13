import { X } from "lucide-react";
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
};

export default function DayBottomBar({
  ymd,
  events,
  onClear,
  onOpenEvent,
}: Props) {
  const dayEvents = [...eventsForDate(events, ymd)].sort(sortEventsForDay);

  return (
    <aside className="day-bottom-bar" aria-label={`${ymd} 일정`}>
      <div className="day-bottom-bar-head">
        <span className="day-bottom-bar-date">{ymd}</span>
        <button
          type="button"
          className="day-bottom-bar-close"
          aria-label="날짜 선택 해제"
          onClick={onClear}
        >
          <X size={20} />
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
