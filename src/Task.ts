// src/Task.ts

import { TaskFn, TaskStatus, TaskOptions } from "./types";

export class Task {
  name: string;
  fn: TaskFn;
  deps: string[];
  status: TaskStatus = "pending";
  retries: number;
  attempts = 0;
  error?: unknown; // last error seen; set on every failed attempt

  constructor(
    name: string,
    fn: TaskFn,
    deps: string[] = [],
    options: TaskOptions = {}
  ) {
    this.name = name;
    this.fn = fn;
    this.deps = deps;
    this.retries = options.retries ?? 0;
  }
}