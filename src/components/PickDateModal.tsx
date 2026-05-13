import { useState, useEffect } from "react";

type Props = {
  open: boolean;
  title: string;
  initialYmd: string;
  onClose: () => void;
  onConfirm: (ymd: string) => void;
};

export default function PickDateModal({
  open,
  title,
  initialYmd,
  onClose,
  onConfirm,
}: Props) {
  const [d, setD] = useState(initialYmd);

  useEffect(() => {
    if (open) setD(initialYmd);
  }, [open, initialYmd]);

  if (!open) return null;

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
          <div className="modal-title">{title}</div>
          <div className="field">
            <label htmlFor="pick-date">날짜</label>
            <input
              id="pick-date"
              type="date"
              value={d}
              onChange={(e) => setD(e.target.value)}
            />
          </div>
          <div className="row-btns">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              취소
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onConfirm(d)}
            >
              추가
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
