import { useCallback, useEffect, useMemo, useState } from "react";
import { Settings } from "lucide-react";
import type { GitHubConfig, ShiftEvent } from "./types";
import { fetchRepoFileJson, saveRepoFileJson } from "./github";
import {
  buildCycleEvents,
  createDayShift,
  createNightShift,
  createOff,
  hasOverlapInRange,
  normalizeLoadedEvent,
  seoulYmd,
} from "./eventLogic";
import CalendarMonth from "./components/CalendarMonth";
import DayBottomBar from "./components/DayBottomBar";
import EventEditor from "./components/EventEditor";
import SettingsPanel, { type StoredSettings } from "./components/SettingsPanel";
import SettingsMenuSheet from "./components/SettingsMenuSheet";
import AddEventModal, { type AddEventKind } from "./components/AddEventModal";
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

function isEventList(x: unknown): x is unknown[] {
  return Array.isArray(x);
}

function normalizeEventsPayload(raw: unknown): ShiftEvent[] {
  if (!isEventList(raw)) return [];
  return raw
    .map((row) => normalizeLoadedEvent(row))
    .filter((e): e is ShiftEvent => e !== null);
}

type EventsUpdater = (draft: ShiftEvent[]) => ShiftEvent[];

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
  const [, setSha] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<ShiftEvent | null>(null);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cycleOpen, setCycleOpen] = useState(false);
  const [addKind, setAddKind] = useState<AddEventKind | null>(null);

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
      const list = normalizeEventsPayload(data);
      setEvents(list);
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
    async (update: EventsUpdater, message: string): Promise<boolean> => {
      const c = toCfg(settings);
      if (!c) {
        alert("설정(토큰 · 저장소)에서 GitHub 정보를 입력해 주세요.");
        return false;
      }
      setLoading(true);
      setErr(null);
      const maxAttempts = 6;
      try {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          const { data, sha: blobSha } = await fetchRepoFileJson<unknown>(c);
          if (!isEventList(data)) {
            throw new Error("events.json 형식이 배열이 아닙니다.");
          }
          const draft = normalizeEventsPayload(data);
          let next: ShiftEvent[];
          try {
            next = update(draft);
          } catch (err) {
            if (err instanceof Error && err.message === "PERSIST_ABORT") {
              return false;
            }
            throw err;
          }
          try {
            const newSha = await saveRepoFileJson(c, next, blobSha, message);
            setEvents(next);
            setSha(newSha);
            return true;
          } catch (e) {
            if (e instanceof Error && e.message === "CONFLICT") {
              continue;
            }
            throw e;
          }
        }
        const { data, sha: freshSha } = await fetchRepoFileJson<unknown>(c);
        if (isEventList(data)) {
          setEvents(normalizeEventsPayload(data));
          setSha(freshSha);
        }
        alert(
          "저장이 계속 겹쳤습니다. 화면은 최신으로 맞춰 두었으니 잠시 후 다시 눌러 주세요."
        );
        return false;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setErr(msg);
        alert(msg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [settings]
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

  const jumpToday = () => {
    const t = seoulYmd(new Date());
    const [y, m] = t.split("-").map(Number);
    setYear(y);
    setMonth(m);
    setSelected(t);
  };

  const handleAdd = async (ev: ShiftEvent) => {
    await persist((d) => [...d, ev], "일정 추가");
  };

  const handleSaveEdit = async (ev: ShiftEvent) => {
    await persist((d) => d.map((x) => (x.id === ev.id ? ev : x)), "일정 수정");
  };

  const handleDelete = async (id: string) => {
    await persist((d) => d.filter((x) => x.id !== id), "일정 삭제");
  };

  const handleCycle = async (startYmd: string) => {
    const ok = await persist((draft) => {
      const conflicts = hasOverlapInRange(draft, startYmd, 6);
      if (conflicts.length > 0) {
        alert(
          `다음 날짜에 기존 일정이 있어 주기를 적용할 수 없습니다.\n${conflicts.join(
            ", "
          )}\n해당 날짜의 일정을 삭제한 뒤 다시 주기를 눌러 주세요.`
        );
        throw new Error("PERSIST_ABORT");
      }
      return [...draft, ...buildCycleEvents(startYmd)];
    }, "주기 6일 등록");
    if (ok) setCycleOpen(false);
  };

  return (
    <div
      className={`app-shell${selected ? " has-day-panel" : ""}`}
    >
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
      <div className="app-main">
        <CalendarMonth
          year={year}
          month={month}
          events={events}
          selected={selected}
          onSelect={(ymd) => setSelected(ymd)}
          onPrevMonth={onPrevMonth}
          onNextMonth={onNextMonth}
          onYearChange={(y) => setYear(y)}
          onMonthChange={(m) => setMonth(m)}
          onJumpToday={jumpToday}
        />
      </div>
      {selected && (
        <DayBottomBar
          ymd={selected}
          events={events}
          onClear={() => setSelected(null)}
          onOpenEvent={(ev) => setEditing(ev)}
          onQuickDay={() => void handleAdd(createDayShift(selected))}
          onQuickNight={() => void handleAdd(createNightShift(selected))}
          onQuickOff={() => void handleAdd(createOff(selected))}
          onQuickCycle={() => setCycleOpen(true)}
          onQuickCustom={() => setAddKind("CUSTOM")}
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
          setAddKind("DAY");
        }}
        onNight={() => {
          setSettingsMenuOpen(false);
          setAddKind("NIGHT");
        }}
        onOff={() => {
          setSettingsMenuOpen(false);
          setAddKind("OFF");
        }}
        onCustom={() => {
          setSettingsMenuOpen(false);
          setAddKind("CUSTOM");
        }}
        onCycle={() => {
          setSettingsMenuOpen(false);
          setCycleOpen(true);
        }}
        onGithub={() => {
          setSettingsMenuOpen(false);
          setSettingsOpen(true);
        }}
      />
      <AddEventModal
        open={addKind !== null}
        kind={addKind}
        initialYmd={defaultPickYmd}
        onClose={() => setAddKind(null)}
        onConfirm={(ev) => void handleAdd(ev)}
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
