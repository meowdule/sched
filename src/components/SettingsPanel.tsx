import { useState } from "react";

export type StoredSettings = {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  path: string;
};

type Props = {
  open: boolean;
  value: StoredSettings;
  defaults: Omit<StoredSettings, "token">;
  /** 빌드에 Supabase env가 있으면 읽기 전용 안내만 표시 */
  storage: "github" | "supabase";
  onClose: () => void;
  onSave: (s: StoredSettings) => void;
};

export default function SettingsPanel({
  open,
  value,
  defaults,
  storage,
  onClose,
  onSave,
}: Props) {
  const [token, setToken] = useState(value.token);
  const [owner, setOwner] = useState(value.owner || defaults.owner);
  const [repo, setRepo] = useState(value.repo || defaults.repo);
  const [branch, setBranch] = useState(value.branch || defaults.branch);
  const [path, setPath] = useState(value.path || defaults.path);

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
          <div className="modal-title">
            {storage === "supabase" ? "Supabase 저장" : "GitHub 연결"}
          </div>
          {storage === "supabase" ? (
            <>
              <p className="hint">
                이 빌드는 Supabase에 일정을 저장합니다. 별도 토큰 입력은 없습니다.
                가족·팀용으로 RLS를 넓게 두었다면, 사이트 주소를 아는 사람은 같은
                달력을 읽고 수정할 수 있습니다.
              </p>
              <div className="row-btns">
                <button type="button" className="btn btn-primary" onClick={onClose}>
                  닫기
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="hint">
                저장소에 쓰기 권한이 있는 Personal Access Token을 입력하세요. 둘만
                쓰는 비공개 링크라도 토큰은 노출되지 않게 주의하세요.
              </p>
              <div className="field">
                <label htmlFor="gh-token">Token</label>
                <input
                  id="gh-token"
                  type="password"
                  autoComplete="off"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_…"
                />
              </div>
              <div className="field">
                <label htmlFor="gh-owner">Owner</label>
                <input
                  id="gh-owner"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="gh-repo">Repo</label>
                <input
                  id="gh-repo"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="gh-branch">Branch</label>
                <input
                  id="gh-branch"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="gh-path">JSON 경로</label>
                <input
                  id="gh-path"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                />
              </div>
              <div className="row-btns">
                <button type="button" className="btn btn-ghost" onClick={onClose}>
                  닫기
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    onSave({ token, owner, repo, branch, path });
                    onClose();
                  }}
                >
                  저장
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
