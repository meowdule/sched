import { useCallback, useEffect, useMemo, useState } from "react";
import { Settings } from "lucide-react";
import type { GitHubConfig, ShiftEvent } from "./types";
import { fetchRepoFileJson, saveRepoFileJson } from "./github";
import {
  buildCycleEvents,
  createDayShift,
  createLeisure,
  createNightShift,
  createOff,
  hasOverlapInRange,
  seoulYmd,
} from "./eventLogic";
import CalendarMonth from "./components/CalendarMonth";
import DaySheet from "./components/DaySheet";
import EventEditor from "./components/EventEditor";
import SettingsPanel, { type StoredSettings } from "./components/SettingsPanel";
import SettingsMenuSheet from "./components/SettingsMenuSheet";
import PickDateModal from "./components/PickDateModal";
import CycleModal from "./components/CycleModal";

const LS = {
  token: "shiftcal_token",
  owner: "shiftcal_owner",
  repo: "shiftcal_repo",
  branch: "shiftcal_branch",
  path: "shiftcal_path",
} as const;

/** 기본 저장소: https://github.com/meowdule/sched */
const DEFAULT_OWNER = "meowdule";
const DEFAULT_REPO = "sched";

function envDefaults(): Omit<StoredSettings, "token"> {
  return {
    owner: import.meta.env.VITE_GITHUB_OWNER || DEFAULT_OWNER,
    repo: import.meta.env.VITE_GITHUB_REPO || DEFAULT_REPO,
    branch: import.meta.env.VITE_GITHUB_BRANCH ?? "main",
    path: import.meta.env.VITE_DATA_PATH ?? "data/events.json",
  };
}

function readStoredSettings(): StoredSettings {
  const d = envDefaults();
  return {
    token: localStorage.getItem(LS.token) ?? "",
    owner: localStorage.getItem(LS.owner) ?? d.owner,
    repo: localStorage.getItem(LS.repo) ?? d.repo,
    branch: localStorage.getItem(LS.branch) ?? d.branch,
    path: localStorage.getItem(LS.path) ?? d.path,
  };
}

function writeStoredSettings(s: StoredSettings) {
  localStorage.setItem(LS.token, s.token);
  localStorage.setItem(LS.owner, s.owner);
  localStorage.setItem(LS.repo, s.repo);
  localStorage.setItem(LS.branch, s.branch);
  localStorage.setItem(LS.path, s.path);
}

function toCfg(s: StoredSettings): GitHubConfig | null {
  if (!s.token.trim() || !s.owner.trim() || !s.repo.trim()) return null;
  return {
    token: s.token.trim(),
    owner: s.owner.trim(),
    repo: s.repo.trim(),
    branch: (s.branch || "main").trim(),
    path: (s.path || "data/events.json").trim(),
  };
}

function isEventList(x: unknown): x is ShiftEvent[] {
  return Array.isArray(x);
}

type PickKind = "DAY" | "NIGHT" | "OFF" | "LEISURE_PARTY" | "LEISURE_GAME";

function pickDateTitle(kind: PickKind): string {
  switch (kind) {
    case "DAY":
      return "주간 넣을 날짜";
    case "NIGHT":
      return "야간 넣을 날짜";
    case "OFF":
      return "비번 넣을 날짜";
    case "LEISURE_PARTY":
      return "노는 시간(파티) 날짜";
    case "LEISURE_GAME":
      return "노는 시간(게임) 날짜";
  }
}

export default function App() {
  const defaults = useMemo(() => envDefaults(), []);
  const [settings, setSettings] = useState<StoredSettings>(() =>
    readStoredSettings()
  );
  const [year, setYear] = useState(() => {
    const t = seoulYmd(new Date());
    return Number(t.split("-")[0]);
  });
  const [month, setMonth] = useState(() => {
    const t = seoulYmd(new Date());
    return Number(t.split("-")[1]);
  });
  const [events, setEvents] = useState<ShiftEvent[]>([]);
  const [sha, setSha] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<ShiftEvent | null>(null);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cycleOpen, setCycleOpen] = useState(false);
  const [pickKind, setPickKind] = useState<PickKind | null>(null);

  const cfg = useMemo(() => toCfg(settings), [settings]);

  const defaultPickYmd = selected ?? seoulYmd(new Date());

  const refresh = useCallback(async () => {
    const c = toCfg(settings);
    if (!c) {
      setEvents([]);
      setSha(null);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const { data, sha: s } = await fetchRepoFileJson<unknown>(c);
      if (!isEventList(data)) {
        throw new Error("events.json 형식이 배열이 아닙니다.");
      }
      setEvents(data);
      setSha(s);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setEvents([]);
      setSha(null);
    } finally {
      setLoading(false);
    }
  }, [settings]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const persist = useCallback(
    async (next: ShiftEvent[], message: string) => {
      const c = toCfg(settings);
      if (!c) {
        alert("설정(토큰 · 저장소)에서 GitHub 정보를 입력해 주세요.");
        return false;
      }
      setLoading(true);
      setErr(null);
      try {
        const nextSha = await saveRepoFileJson(c, next, sha, message);
        setEvents(next);
        setSha(nextSha);
        return true;
      } catch (e) {
        if (e instanceof Error && e.message === "CONFLICT") {
          try {
            const { data, sha: freshSha } = await fetchRepoFileJson<unknown>(c);
            if (isEventList(data)) {
              setEvents(data);
              setSha(freshSha);
            }
          } catch {
            /* ignore */
          }
          alert(
            "다른 쪽에서 먼저 저장했습니다. 최신 데이터로 맞췄으니 다시 시도해 주세요."
          );
          return false;
        }
        const msg = e instanceof Error ? e.message : String(e);
        setErr(msg);
        alert(msg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [settings, sha]
  );

  const onPrevMonth = () => {
    if (month <= 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };

  const onNextMonth = () => {
    if (month >= 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  const handleAdd = async (ev: ShiftEvent) => {
    const next = [...events, ev];
    await persist(next, "일정 추가");
  };

  const handleSaveEdit = async (ev: ShiftEvent) => {
    const next = events.map((x) => (x.id === ev.id ? ev : x));
    await persist(next, "일정 수정");
  };

  const handleDelete = async (id: string) => {
    const next = events.filter((x) => x.id !== id);
    await persist(next, "일정 삭제");
  };

  const handleCycle = async (startYmd: string) => {
    const conflicts = hasOverlapInRange(events, startYmd, 6);
    if (conflicts.length > 0) {
      alert(
        `다음 날짜에 기존 일정이 있어 주기를 적용할 수 없습니다.\n${conflicts.join(
          ", "
        )}\n해당 날짜의 일정을 삭제한 뒤 다시 주기를 눌러 주세요.`
      );
      return;
    }
    const extra = buildCycleEvents(startYmd);
    const next = [...events, ...extra];
    const ok = await persist(next, "주기 6일 등록");
    if (ok) setCycleOpen(false);
  };

  const confirmPickDate = async (ymd: string) => {
    if (!pickKind) return;
    let ev: ShiftEvent | null = null;
    switch (pickKind) {
      case "DAY":
        ev = createDayShift(ymd);
        break;
      case "NIGHT":
        ev = createNightShift(ymd);
        break;
      case "OFF":
        ev = createOff(ymd);
        break;
      case "LEISURE_PARTY":
        ev = createLeisure(ymd, "party");
        break;
      case "LEISURE_GAME":
        ev = createLeisure(ymd, "game");
        break;
    }
    setPickKind(null);
    if (ev) await handleAdd(ev);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="month-title" style={{ fontSize: "1.1rem" }}>
          일정
        </div>
        <button
          type="button"
          className="icon-btn"
          aria-label="추가 및 설정"
          onClick={() => setSettingsMenuOpen(true)}
        >
          <Settings size={22} />
        </button>
      </header>
      {loading && <div className="loading-bar" style={{ marginBottom: 10 }} />}
      {err && !loading && (
        <p className="hint" style={{ color: "var(--danger)", marginBottom: 8 }}>
          {err}
        </p>
      )}
      {!cfg && (
        <p className="hint" style={{ marginBottom: 10 }}>
          톱니바퀴 → 「토큰 · 저장소 설정」에서 GitHub 토큰을 넣으면 이 기기에서
          바로 저장됩니다.
        </p>
      )}
      <CalendarMonth
        year={year}
        month={month}
        events={events}
        selected={selected}
        onSelect={(ymd) => setSelected(ymd)}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
      />
      {selected && (
        <DaySheet
          ymd={selected}
          events={events}
          onClose={() => setSelected(null)}
          onOpenEvent={(ev) => setEditing(ev)}
        />
      )}
      {editing && (
        <EventEditor
          event={editing}
          onClose={() => setEditing(null)}
          onSave={(ev) => void handleSaveEdit(ev)}
          onDelete={(id) => void handleDelete(id)}
        />
      )}
      <SettingsMenuSheet
        open={settingsMenuOpen}
        onClose={() => setSettingsMenuOpen(false)}
        onDay={() => {
          setSettingsMenuOpen(false);
          setPickKind("DAY");
        }}
        onNight={() => {
          setSettingsMenuOpen(false);
          setPickKind("NIGHT");
        }}
        onOff={() => {
          setSettingsMenuOpen(false);
          setPickKind("OFF");
        }}
        onCycle={() => {
          setSettingsMenuOpen(false);
          setCycleOpen(true);
        }}
        onLeisureParty={() => {
          setSettingsMenuOpen(false);
          setPickKind("LEISURE_PARTY");
        }}
        onLeisureGame={() => {
          setSettingsMenuOpen(false);
          setPickKind("LEISURE_GAME");
        }}
        onGithub={() => {
          setSettingsMenuOpen(false);
          setSettingsOpen(true);
        }}
      />
      <PickDateModal
        open={pickKind !== null}
        title={pickKind ? pickDateTitle(pickKind) : ""}
        initialYmd={defaultPickYmd}
        onClose={() => setPickKind(null)}
        onConfirm={(ymd) => void confirmPickDate(ymd)}
      />
      <SettingsPanel
        open={settingsOpen}
        value={settings}
        defaults={defaults}
        onClose={() => setSettingsOpen(false)}
        onSave={(s) => {
          writeStoredSettings(s);
          setSettings(s);
        }}
      />
      <CycleModal
        open={cycleOpen}
        anchorYmd={defaultPickYmd}
        onClose={() => setCycleOpen(false)}
        onConfirm={(start) => void handleCycle(start)}
      />
    </div>
  );
}
