export type EventType = "DAY" | "NIGHT" | "OFF" | "LEISURE";

export type LeisureVariant = "party" | "game";

export interface ShiftEvent {
  id: string;
  type: EventType;
  /** YYYY-MM-DD for OFF (시간 없음) */
  date?: string;
  /** ISO 8601 with offset, timed types */
  start?: string;
  end?: string;
  leisureVariant?: LeisureVariant;
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
