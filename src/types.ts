export type EventType = "DAY" | "NIGHT" | "OFF" | "CUSTOM";

export interface ShiftEvent {
  id: string;
  type: EventType;
  /** YYYY-MM-DD for OFF (시간 없음) */
  date?: string;
  /** ISO 8601 with offset, timed types */
  start?: string;
  end?: string;
  /** CUSTOM(일정) 제목 */
  title?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GitHubConfig {
  owner: string;
  repo: string;
  branch: string;
  path: string;
  token: string;
}
