import type { ShiftEvent } from "../types";
import {
  eventsForDate,
  formatTimeRange,
  labelForType,
  sortEventsForDay,
} from "../eventLogic";

type Props = {
  ymd: string;
  events: ShiftEvent[];
  onClose: () => void;
  onOpenEvent: (ev: ShiftEvent) => void;
};

export default function DaySheet({ ymd, events, onClose, onOpenEvent }: Props) {
  const dayEvents = [...eventsForDate(events, ymd)].sort(sortEventsForDay);

  return (
    <>
      <button
        type="button"
        className="sheet-backdrop"
        aria-label="닫기"
        onClick={onClose}
      />
      <div className="sheet sheet--events-only" role="dialog" aria-modal="true">
        <div className="sheet-handle" />
        <div className="sheet-title">{ymd}</div>
        {dayEvents.length === 0 ? (
          <p className="empty-hint">이 날짜에 일정이 없습니다.</p>
        ) : (
          <div className="day-events-scroll">
            {dayEvents.map((ev) => (
              <button
                key={ev.id}
                type="button"
                className="event-row"
                onClick={() => onOpenEvent(ev)}
              >
                <span className="event-row-title">
                  {labelForType(ev.type)}
                  {ev.type === "LEISURE" && ev.leisureVariant === "game"
                    ? " · 게임"
                    : ev.type === "LEISURE" && ev.leisureVariant === "party"
                      ? " · 파티"
                      : ""}
                </span>
                <span className="event-row-sub">{formatTimeRange(ev)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
