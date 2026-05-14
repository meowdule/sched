import { Sun, Moon, Armchair, Sparkles, Repeat, Settings } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onDay: () => void;
  onNight: () => void;
  onOff: () => void;
  onCustom: () => void;
  onCycle: () => void;
  onGithub: () => void;
  /** 기본: 저장소 설정 */
  settingsLinkLabel?: string;
};

export default function SettingsMenuSheet({
  open,
  onClose,
  onDay,
  onNight,
  onOff,
  onCustom,
  onCycle,
  onGithub,
  settingsLinkLabel = "저장소 설정",
}: Props) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="sheet-backdrop"
        aria-label="닫기"
        onClick={onClose}
      />
      <div
        className="sheet sheet--settings-menu sheet--settings-v2"
        role="dialog"
        aria-modal="true"
      >
        <div className="sheet-handle" />
        <div className="settings-sheet-heading">
          <div className="settings-sheet-title">추가 · 설정</div>
          <div className="settings-sheet-sub">근무 유형을 선택하세요</div>
        </div>
        <div className="settings-kind-cards">
          <button
            type="button"
            className="settings-kind-card settings-kind-card--day"
            onClick={onDay}
          >
            <span className="settings-kind-card-icon" aria-hidden>
              <Sun size={26} strokeWidth={2} />
            </span>
            <span className="settings-kind-card-label">주간</span>
          </button>
          <button
            type="button"
            className="settings-kind-card settings-kind-card--night"
            onClick={onNight}
          >
            <span className="settings-kind-card-icon" aria-hidden>
              <Moon size={26} strokeWidth={2} />
            </span>
            <span className="settings-kind-card-label">야간</span>
          </button>
          <button
            type="button"
            className="settings-kind-card settings-kind-card--off"
            onClick={onOff}
          >
            <span className="settings-kind-card-icon" aria-hidden>
              <Armchair size={26} strokeWidth={2} />
            </span>
            <span className="settings-kind-card-label">비번</span>
          </button>
        </div>
        <div className="settings-pill-row">
          <button
            type="button"
            className="settings-pill settings-pill--custom"
            onClick={onCustom}
          >
            <Sparkles size={15} strokeWidth={2.2} className="settings-pill-ico" />
            <span>일정</span>
          </button>
          <button
            type="button"
            className="settings-pill settings-pill--cycle"
            onClick={onCycle}
          >
            <Repeat size={15} strokeWidth={2.2} className="settings-pill-ico" />
            <span>주기</span>
          </button>
        </div>
        <button
          type="button"
          className="settings-footer-link"
          onClick={onGithub}
        >
          <Settings size={16} strokeWidth={2} aria-hidden />
          <span>{settingsLinkLabel}</span>
        </button>
      </div>
    </>
  );
}
