import { PartyPopper, Gamepad2 } from "lucide-react";
import type { ShiftEvent, LeisureVariant } from "../types";
import {
  createDayShift,
  createNightShift,
  createOff,
  createLeisure,
  eventsForDate,
  formatTimeRange,
  labelForType,
  sortEventsForDay,
} from "../eventLogic";

type Props = {
  ymd: string;
  events: ShiftEvent[];
  onClose: () => void;
  onAdd: (ev: ShiftEvent) => void;
  onOpenEvent: (ev: ShiftEvent) => void;
  onOpenCycle: () => void;
};

export default function DaySheet({
  ymd,
  events,
  onClose,
  onAdd,
  onOpenEvent,
  onOpenCycle,
}: Props) {
  const dayEvents = [...eventsForDate(events, ymd)].sort(sortEventsForDay);

  return (
    <>
      <button
        type="button"
        className="sheet-backdrop"
        aria-label="닫기"
        onClick={onClose}
      />
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="sheet-handle" />
        <div className="sheet-title">{ymd}</div>
        {dayEvents.length === 0 ? (
          <p className="empty-hint">이 날짜에 일정이 없습니다.</p>
        ) : (
          <div style={{ overflowY: "auto", flex: 1, marginBottom: 8 }}>
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
        <div className="quick-grid">
          <button
            type="button"
            className="quick-btn"
            onClick={() => onAdd(createDayShift(ymd))}
          >
            주간
          </button>
          <button
            type="button"
            className="quick-btn"
            onClick={() => onAdd(createNightShift(ymd))}
          >
            야간
          </button>
          <button
            type="button"
            className="quick-btn"
            onClick={() => onAdd(createOff(ymd))}
          >
            비번
          </button>
        </div>
        <div className="leisure-row">
          <button
            type="button"
            className="leisure-btn"
            title="노는 시간 (19:00–22:00)"
            aria-label="노는 시간 파티"
            onClick={() => onAdd(createLeisure(ymd, "party" as LeisureVariant))}
          >
            <PartyPopper size={26} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            className="leisure-btn"
            title="노는 시간 (19:00–22:00)"
            aria-label="노는 시간 게임"
            onClick={() => onAdd(createLeisure(ymd, "game" as LeisureVariant))}
          >
            <Gamepad2 size={26} strokeWidth={1.8} />
          </button>
        </div>
        <div className="toolbar-cycle">
          <button type="button" className="cycle-btn" onClick={onOpenCycle}>
            주기
          </button>
        </div>
      </div>
    </>
  );
}
