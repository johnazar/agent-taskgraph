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
}