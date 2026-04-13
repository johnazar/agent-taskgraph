// src/types.ts

export type TaskStatus = 
  | "pending"
  | "running"
  | "done"
  | "failed";

export type TaskFn = () => Promise<void>;

export interface TaskOptions {
  retries?: number;
}