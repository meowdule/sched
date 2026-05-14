type Props = {
  open: boolean;
  onClose: () => void;
  onDay: () => void;
  onNight: () => void;
  onOff: () => void;
  onCustom: () => void;
  onCycle: () => void;
  onGithub: () => void;
  /** 기본: 토큰 · 저장소 설정 */
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
  settingsLinkLabel = "토큰 · 저장소 설정",
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
      <div className="sheet sheet--settings-menu" role="dialog" aria-modal="true">
        <div className="sheet-handle" />
        <div className="sheet-title">추가 · 설정</div>
        <div className="settings-menu-grid">
          <button type="button" className="settings-menu-btn" onClick={onDay}>
            주간
          </button>
          <button type="button" className="settings-menu-btn" onClick={onNight}>
            야간
          </button>
          <button type="button" className="settings-menu-btn" onClick={onOff}>
            비번
          </button>
        </div>
        <button type="button" className="settings-menu-custom" onClick={onCustom}>
          일정
        </button>
        <button type="button" className="cycle-btn" onClick={onCycle}>
          주기
        </button>
        <button type="button" className="settings-menu-token" onClick={onGithub}>
          {settingsLinkLabel}
        </button>
      </div>
    </>
  );
}
