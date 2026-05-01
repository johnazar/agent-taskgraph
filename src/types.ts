// src/types.ts

export type TaskStatus =
  | "pending"
  | "running"
  | "done"
  | "failed"
  | "skipped"; // dep failed or was skipped — never ran

export type TaskFn = () => Promise<void>;

export interface TaskOptions {
  retries?: number;
}

export interface RunOptions {
  /** Max tasks running at once. Default: Infinity (fully parallel). */
  concurrency?: number;
  /** Stop scheduling new tasks after the first failure. Default: false. */
  failFast?: boolean;
  /** Fires each time a task begins an attempt (including retries). */
  onTaskStart?: (name: string) => void;
  /** Fires when a task reaches a terminal state: "done", "failed", or "skipped". */
  onTaskDone?: (name: string, status: TaskStatus) => void;
  /** Persistence store. Supply a FileStateStore (or custom implementation) to enable crash-resume. */
  store?: StateStore;
  /** Delete the persisted state after a fully successful run. Default: true. */
  clearOnSuccess?: boolean;
}

// ─── Persistence ─────────────────────────────────────────────────────────────

export interface PersistedTaskState {
  status: TaskStatus;
  attempts: number;
  errorMessage?: string;
}

export interface PersistedState {
  version: 1;
  savedAt: string; // ISO-8601
  tasks: Record<string, PersistedTaskState>;
}

export interface StateStore {
  /** Return the last saved state, or null if none exists / it is invalid. */
  load(): Promise<PersistedState | null>;
  /** Persist the current state snapshot. */
  save(state: PersistedState): Promise<void>;
  /** Remove the stored state (called automatically on clean completion). */
  clear(): Promise<void>;
}