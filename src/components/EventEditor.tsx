import { useState, useEffect } from "react";
import {
  Sun,
  Moon,
  Armchair,
  Sparkles,
  Clock,
  Check,
  X,
  Trash2,
} from "lucide-react";
import type { ShiftEvent } from "../types";
import { eventDisplayTitle, labelForType, nowIso } from "../eventLogic";
import { datetimeLocalToSeoulIso, isoToDatetimeLocal } from "../datetimeLocal";

type Props = {
  event: ShiftEvent;
  onSave: (ev: ShiftEvent) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
};

export default function EventEditor({
  event,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const [offDate, setOffDate] = useState(event.date ?? "");
  const [start, setStart] = useState(
    event.start ? isoToDatetimeLocal(event.start) : ""
  );
  const [end, setEnd] = useState(
    event.end ? isoToDatetimeLocal(event.end) : ""
  );
  const [title, setTitle] = useState(event.title ?? "");

  useEffect(() => {
    setOffDate(event.date ?? "");
    setStart(event.start ? isoToDatetimeLocal(event.start) : "");
    setEnd(event.end ? isoToDatetimeLocal(event.end) : "");
    setTitle(event.title ?? "");
  }, [event]);

  const isOff = event.type === "OFF";
  const isCustom = event.type === "CUSTOM";
  const modalTitle = isCustom
    ? `일정 · ${eventDisplayTitle(event)}`
    : `${labelForType(event.type)} 수정`;

  const headerIcon =
    event.type === "DAY" ? (
      <Sun size={22} strokeWidth={2.1} />
    ) : event.type === "NIGHT" ? (
      <Moon size={22} strokeWidth={2.1} />
    ) : event.type === "OFF" ? (
      <Armchair size={22} strokeWidth={2.1} />
    ) : (
      <Sparkles size={22} strokeWidth={2.1} />
    );

  const headerTone =
    event.type === "DAY"
      ? "modal-kind-badge--day"
      : event.type === "NIGHT"
        ? "modal-kind-badge--night"
        : event.type === "OFF"
          ? "modal-kind-badge--off"
          : "modal-kind-badge--custom";

  const save = () => {
    if (isOff) {
      onSave({
        ...event,
        date: offDate,
        updatedAt: nowIso(),
      });
    } else if (isCustom) {
      onSave({
        ...event,
        title: title.trim() || "데이트",
        start: datetimeLocalToSeoulIso(start),
        end: datetimeLocalToSeoulIso(end),
        updatedAt: nowIso(),
      });
    } else {
      onSave({
        ...event,
        start: datetimeLocalToSeoulIso(start),
        end: datetimeLocalToSeoulIso(end),
        updatedAt: nowIso(),
      });
    }
    onClose();
  };

  const del = () => {
    if (confirm("이 일정을 삭제할까요?")) {
      onDelete(event.id);
      onClose();
    }
  };

  return (
    <>
      <button
        type="button"
        className="sheet-backdrop"
        style={{ zIndex: 55 }}
        aria-label="닫기"
        onClick={onClose}
      />
      <div className="modal modal--form" style={{ zIndex: 60 }}>
        <div className="modal-card modal-card--fancy">
          <div className={`modal-kind-badge ${headerTone}`}>{headerIcon}</div>
          <div className="modal-title modal-title--fancy">{modalTitle}</div>
          <p className="modal-subtitle">일정을 수정하거나 삭제할 수 있습니다</p>
          {isOff ? (
            <div className="field field--fancy">
              <label htmlFor="off-date">날짜</label>
              <div className="field-input-wrap">
                <input
                  id="off-date"
                  className="field-input-fancy"
                  type="date"
                  value={offDate}
                  onChange={(e) => setOffDate(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <>
              {isCustom && (
                <div className="field field--fancy">
                  <label htmlFor="ev-title">제목</label>
                  <div className="field-input-wrap">
                    <input
                      id="ev-title"
                      className="field-input-fancy"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="데이트"
                    />
                  </div>
                </div>
              )}
              <div className="field field--fancy">
                <label htmlFor="ev-start">시작</label>
                <div className="field-input-wrap">
                  <input
                    id="ev-start"
                    className="field-input-fancy"
                    type="datetime-local"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                  />
                  <Clock
                    className="field-input-suffix"
                    size={18}
                    strokeWidth={2}
                    aria-hidden
                  />
                </div>
              </div>
              <div className="field field--fancy">
                <label htmlFor="ev-end">종료</label>
                <div className="field-input-wrap">
                  <input
                    id="ev-end"
                    className="field-input-fancy"
                    type="datetime-local"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                  />
                  <Clock
                    className="field-input-suffix"
                    size={18}
                    strokeWidth={2}
                    aria-hidden
                  />
                </div>
              </div>
            </>
          )}
          <div className="modal-ico-row">
            <button
              type="button"
              className="modal-ico-btn modal-ico-btn--primary"
              aria-label="저장"
              onClick={save}
            >
              <Check size={24} strokeWidth={2.4} />
            </button>
            <button
              type="button"
              className="modal-ico-btn modal-ico-btn--ghost"
              aria-label="취소"
              onClick={onClose}
            >
              <X size={24} strokeWidth={2.2} />
            </button>
            <button
              type="button"
              className="modal-ico-btn modal-ico-btn--danger"
              aria-label="삭제"
              onClick={del}
            >
              <Trash2 size={22} strokeWidth={2.1} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
