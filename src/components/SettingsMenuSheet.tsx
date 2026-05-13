import { PartyPopper, Gamepad2 } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onDay: () => void;
  onNight: () => void;
  onOff: () => void;
  onCycle: () => void;
  onLeisureParty: () => void;
  onLeisureGame: () => void;
  onGithub: () => void;
};

export default function SettingsMenuSheet({
  open,
  onClose,
  onDay,
  onNight,
  onOff,
  onCycle,
  onLeisureParty,
  onLeisureGame,
  onGithub,
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
        <div className="settings-menu-leisure">
          <button
            type="button"
            className="leisure-btn"
            title="노는 시간 19:00–22:00"
            aria-label="노는 시간 파티"
            onClick={onLeisureParty}
          >
            <PartyPopper size={26} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            className="leisure-btn"
            title="노는 시간 19:00–22:00"
            aria-label="노는 시간 게임"
            onClick={onLeisureGame}
          >
            <Gamepad2 size={26} strokeWidth={1.8} />
          </button>
        </div>
        <button type="button" className="cycle-btn" onClick={onCycle}>
          주기
        </button>
        <button type="button" className="settings-menu-token" onClick={onGithub}>
          토큰 · 저장소 설정
        </button>
      </div>
    </>
  );
}
