import { useState, useEffect } from "react";
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

  return (
    <>
      <button
        type="button"
        className="sheet-backdrop"
        style={{ zIndex: 55 }}
        aria-label="닫기"
        onClick={onClose}
      />
      <div className="modal" style={{ zIndex: 60 }}>
        <div className="modal-card">
          <div className="modal-title">{modalTitle}</div>
          {isOff ? (
            <div className="field">
              <label htmlFor="off-date">날짜</label>
              <input
                id="off-date"
                type="date"
                value={offDate}
                onChange={(e) => setOffDate(e.target.value)}
              />
            </div>
          ) : (
            <>
              {isCustom && (
                <div className="field">
                  <label htmlFor="ev-title">제목</label>
                  <input
                    id="ev-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="데이트"
                  />
                </div>
              )}
              <div className="field">
                <label htmlFor="ev-start">시작</label>
                <input
                  id="ev-start"
                  type="datetime-local"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="ev-end">종료</label>
                <input
                  id="ev-end"
                  type="datetime-local"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </div>
            </>
          )}
          <div className="row-btns">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              취소
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
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
              }}
            >
              저장
            </button>
          </div>
          <div className="row-btns">
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                if (confirm("이 일정을 삭제할까요?")) {
                  onDelete(event.id);
                  onClose();
                }
              }}
            >
              삭제
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
