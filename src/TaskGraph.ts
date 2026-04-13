// src/TaskGraph.ts

import { Task } from "./Task";

export class TaskGraph {
  private tasks = new Map<string, Task>();

  addTask(
    name: string,
    fn: () => Promise<void>,
    deps: string[] = [],
    options = {}
  ) {
    if (this.tasks.has(name)) {
      throw new Error(`Task "${name}" already exists`);
    }

    const task = new Task(name, fn, deps, options);
    this.tasks.set(name, task);
  }

  async run() {
    while (true) {
      const runnable = this.getRunnableTasks();

      if (runnable.length === 0) break;

      for (const task of runnable) {
        await this.runTask(task);
      }
    }

    const failed = [...this.tasks.values()].filter(
      (t) => t.status === "failed"
    );

    if (failed.length > 0) {
      throw new Error(
        `Some tasks failed: ${failed.map((t) => t.name).join(", ")}`
      );
    }
  }

  private getRunnableTasks() {
    return [...this.tasks.values()].filter((task) => {
      if (task.status !== "pending") return false;

      return task.deps.every((dep) => {
        const depTask = this.tasks.get(dep);
        return depTask?.status === "done";
      });
    });
  }

  private async runTask(task: Task) {
    task.status = "running";
    task.attempts++;

    try {
      await task.fn();
      task.status = "done";
    } catch (err) {
      if (task.attempts <= task.retries) {
        task.status = "pending";
      } else {
        task.status = "failed";
      }
    }
  }

  getStatus() {
    const status: Record<string, string> = {};

    for (const [name, task] of this.tasks) {
      status[name] = task.status;
    }

    return status;
  }
}