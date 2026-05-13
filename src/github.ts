import type { GitHubConfig } from "./types";

const API = "https://api.github.com";

export interface FileState<T> {
  data: T;
  sha: string | null;
}

function headers(token: string): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export async function fetchRepoFileJson<T>(
  cfg: GitHubConfig
): Promise<FileState<T>> {
  const url = `${API}/repos/${cfg.owner}/${cfg.repo}/contents/${encodeURIComponent(
    cfg.path
  )}?ref=${encodeURIComponent(cfg.branch)}`;
  const res = await fetch(url, { headers: headers(cfg.token) });
  if (res.status === 404) {
    return { data: [] as unknown as T, sha: null };
  }
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`GitHub 읽기 실패 (${res.status}): ${t}`);
  }
  const meta = (await res.json()) as { content: string; sha: string };
  const raw = atob(meta.content.replace(/\n/g, ""));
  const data = JSON.parse(raw) as T;
  return { data, sha: meta.sha };
}

export async function saveRepoFileJson<T>(
  cfg: GitHubConfig,
  data: T,
  sha: string | null,
  message: string
): Promise<string> {
  const url = `${API}/repos/${cfg.owner}/${cfg.repo}/contents/${encodeURIComponent(
    cfg.path
  )}`;
  const body = {
    message,
    content: btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2)))),
    branch: cfg.branch,
    ...(sha ? { sha } : {}),
  };
  const res = await fetch(url, {
    method: "PUT",
    headers: { ...headers(cfg.token), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.status === 409) {
    throw new Error("CONFLICT");
  }
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`GitHub 저장 실패 (${res.status}): ${t}`);
  }
  const json = (await res.json()) as { content?: { sha?: string } };
  const next = json.content?.sha;
  if (!next) {
    throw new Error("GitHub 응답에 sha가 없습니다.");
  }
  return next;
}
