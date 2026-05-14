import { useState, useEffect } from "react";
import { Sun, Moon, Armchair, Sparkles, Check, X } from "lucide-react";
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

function subtitleForKind(k: AddEventKind): string {
  switch (k) {
    case "OFF":
      return "비번 날짜를 등록하세요";
    default:
      return "근무 일정을 등록하세요";
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

  const headerIcon =
    kind === "DAY" ? (
      <Sun size={22} strokeWidth={2.1} />
    ) : kind === "NIGHT" ? (
      <Moon size={22} strokeWidth={2.1} />
    ) : kind === "OFF" ? (
      <Armchair size={22} strokeWidth={2.1} />
    ) : (
      <Sparkles size={22} strokeWidth={2.1} />
    );

  const headerTone =
    kind === "DAY"
      ? "modal-kind-badge--day"
      : kind === "NIGHT"
        ? "modal-kind-badge--night"
        : kind === "OFF"
          ? "modal-kind-badge--off"
          : "modal-kind-badge--custom";

  return (
    <>
      <button
        type="button"
        className="sheet-backdrop"
        style={{ zIndex: 65 }}
        aria-label="닫기"
        onClick={onClose}
      />
      <div className="modal modal--form" style={{ zIndex: 70 }}>
        <div className="modal-card modal-card--fancy">
          <div className={`modal-kind-badge ${headerTone}`}>{headerIcon}</div>
          <div className="modal-title modal-title--fancy">{titleForKind(kind)}</div>
          <p className="modal-subtitle">{subtitleForKind(kind)}</p>
          <div className="field field--fancy">
            <label htmlFor="add-ymd">날짜</label>
            <input
              id="add-ymd"
              className="field-input-fancy"
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
            <div className="field field--fancy">
              <label htmlFor="add-title">제목</label>
              <input
                id="add-title"
                className="field-input-fancy"
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
              <div className="field field--fancy">
                <label htmlFor="add-start">시작</label>
                <input
                  id="add-start"
                  className="field-input-fancy"
                  type="datetime-local"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </div>
              <div className="field field--fancy">
                <label htmlFor="add-end">종료</label>
                <input
                  id="add-end"
                  className="field-input-fancy"
                  type="datetime-local"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </div>
            </>
          )}
          <div className="modal-ico-row modal-ico-row--dual">
            <button
              type="button"
              className="modal-ico-btn modal-ico-btn--primary"
              aria-label="추가하기"
              onClick={submit}
            >
              <Check size={22} strokeWidth={2.4} />
            </button>
            <button
              type="button"
              className="modal-ico-btn modal-ico-btn--ghost"
              aria-label="취소"
              onClick={onClose}
            >
              <X size={22} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
