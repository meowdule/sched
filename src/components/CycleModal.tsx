import { useState, useEffect } from "react";

type Props = {
  open: boolean;
  anchorYmd: string;
  onClose: () => void;
  onConfirm: (startYmd: string) => void;
};

export default function CycleModal({
  open,
  anchorYmd,
  onClose,
  onConfirm,
}: Props) {
  const [d, setD] = useState(anchorYmd);

  useEffect(() => {
    if (open) setD(anchorYmd);
  }, [open, anchorYmd]);

  if (!open) return null;

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
          <div className="modal-title">주기 적용</div>
          <p className="hint">
            선택한 날짜부터 6일(d~d+5)에 주간·야간·비번이 자동으로 들어갑니다.
            해당 구간에 이미 일정이 있으면 적용되지 않고 안내합니다.
          </p>
          <div className="field">
            <label htmlFor="cycle-start">시작일</label>
            <input
              id="cycle-start"
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
              6일 등록
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
