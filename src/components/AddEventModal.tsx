import { useState, useEffect } from "react";
import type { ShiftEvent } from "../types";
import {
  createCustom,
  createDayShift,
  createNightShift,
  createOff,
} from "../eventLogic";
import { datetimeLocalToSeoulIso, isoToDatetimeLocal } from "../datetimeLocal";

export type AddEventKind = "DAY" | "NIGHT" | "OFF" | "CUSTOM";

type Props = {
  open: boolean;
  kind: AddEventKind | null;
  initialYmd: string;
  onClose: () => void;
  onConfirm: (ev: ShiftEvent) => void;
};

function titleForKind(k: AddEventKind): string {
  switch (k) {
    case "DAY":
      return "주간 추가";
    case "NIGHT":
      return "야간 추가";
    case "OFF":
      return "비번 추가";
    case "CUSTOM":
      return "일정 추가";
  }
}

export default function AddEventModal({
  open,
  kind,
  initialYmd,
  onClose,
  onConfirm,
}: Props) {
  const [ymd, setYmd] = useState(initialYmd);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [title, setTitle] = useState("데이트");

  useEffect(() => {
    if (!open || !kind) return;
    setYmd(initialYmd);
    if (kind === "OFF") return;
    if (kind === "DAY") {
      const d = createDayShift(initialYmd);
      setStart(isoToDatetimeLocal(d.start!));
      setEnd(isoToDatetimeLocal(d.end!));
      return;
    }
    if (kind === "NIGHT") {
      const n = createNightShift(initialYmd);
      setStart(isoToDatetimeLocal(n.start!));
      setEnd(isoToDatetimeLocal(n.end!));
      return;
    }
    if (kind === "CUSTOM") {
      setTitle("데이트");
      const c = createCustom(initialYmd, "데이트");
      setStart(isoToDatetimeLocal(c.start!));
      setEnd(isoToDatetimeLocal(c.end!));
    }
  }, [open, kind, initialYmd]);

  if (!open || !kind) return null;

  const submit = () => {
    if (kind === "OFF") {
      onConfirm(createOff(ymd));
      onClose();
      return;
    }
    const sIso = datetimeLocalToSeoulIso(start);
    const eIso = datetimeLocalToSeoulIso(end);
    if (kind === "DAY") {
      onConfirm(createDayShift(ymd, sIso, eIso));
    } else if (kind === "NIGHT") {
      onConfirm(createNightShift(ymd, sIso, eIso));
    } else {
      onConfirm(createCustom(ymd, title, sIso, eIso));
    }
    onClose();
  };

  return (
    <>
      <button
        type="button"
        className="sheet-backdrop"
        style={{ zIndex: 65 }}
        aria-label="닫기"
        onClick={onClose}
      />
      <div className="modal" style={{ zIndex: 70 }}>
        <div className="modal-card">
          <div className="modal-title">{titleForKind(kind)}</div>
          <div className="field">
            <label htmlFor="add-ymd">날짜</label>
            <input
              id="add-ymd"
              type="date"
              value={ymd}
              onChange={(e) => {
                const next = e.target.value;
                setYmd(next);
                if (kind === "DAY") {
                  const d = createDayShift(next);
                  setStart(isoToDatetimeLocal(d.start!));
                  setEnd(isoToDatetimeLocal(d.end!));
                } else if (kind === "NIGHT") {
                  const n = createNightShift(next);
                  setStart(isoToDatetimeLocal(n.start!));
                  setEnd(isoToDatetimeLocal(n.end!));
                } else if (kind === "CUSTOM") {
                  const c = createCustom(next, title || "데이트");
                  setStart(isoToDatetimeLocal(c.start!));
                  setEnd(isoToDatetimeLocal(c.end!));
                }
              }}
            />
          </div>
          {kind === "CUSTOM" && (
            <>
              <div className="field">
                <label htmlFor="add-title">제목</label>
                <input
                  id="add-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="데이트"
                />
              </div>
              <div className="title-chips">
                <button
                  type="button"
                  className="chip-btn"
                  onClick={() => setTitle("데이트")}
                >
                  데이트
                </button>
                <button
                  type="button"
                  className="chip-btn"
                  onClick={() => setTitle("에스코트")}
                >
                  에스코트
                </button>
              </div>
            </>
          )}
          {kind !== "OFF" && (
            <>
              <div className="field">
                <label htmlFor="add-start">시작</label>
                <input
                  id="add-start"
                  type="datetime-local"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="add-end">종료</label>
                <input
                  id="add-end"
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
            <button type="button" className="btn btn-primary" onClick={submit}>
              추가
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
