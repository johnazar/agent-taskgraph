// src/TaskGraph.ts

import { Task } from "./Task";
import { PersistedState, RunOptions, TaskStatus } from "./types";

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

  /**
   * Run all tasks respecting dependencies and the concurrency limit.
   *
   * Algorithm — self-scheduling worker pool:
   *   schedule() fills open slots with every task whose deps are all "done".
   *   Each task's completion callback decrements the active counter and calls
   *   schedule() again, creating a ripple that drives execution forward without
   *   polling or Promise.race ordering concerns.
   */
  run(options: RunOptions = {}): Promise<void> {
    const {
      concurrency = Infinity,
      failFast = false,
      onTaskStart,
      onTaskDone,
      store,
      clearOnSuccess = true,
    } = options;

    const buildPersistedState = (): PersistedState => ({
      version: 1,
      savedAt: new Date().toISOString(),
      tasks: Object.fromEntries(
        [...this.tasks.values()].map((t) => [
          t.name,
          {
            status: t.status,
            attempts: t.attempts,
            ...(t.error != null
              ? { errorMessage: String(t.error) }
              : undefined),
          },
        ])
      ),
    });

    const saveState = async () => {
      if (!store) return;
      try {
        await store.save(buildPersistedState());
      } catch {
        // A failed snapshot write is non-fatal — execution continues.
      }
    };

    const applyRestoredState = (saved: PersistedState) => {
      for (const task of this.tasks.values()) {
        const s = saved.tasks[task.name];
        if (!s) continue; // new task not in snapshot → start fresh

        if (s.status === "done") {
          task.status = "done";
          task.attempts = s.attempts;
        } else if (s.status === "failed") {
          task.attempts = s.attempts;
          // Retry budget not exhausted → give it another chance
          task.status = task.attempts <= task.retries ? "pending" : "failed";
        } else if (s.status === "running") {
          // Crashed mid-run — counts as an attempt, retry if budget remains
          task.attempts = s.attempts;
          task.status = task.attempts <= task.retries ? "pending" : "failed";
        }
        // pending / skipped / absent → leave as default (pending, attempts=0)
      }
    };

    const runAsync = async () => {
      if (store) {
        const saved = await store.load();
        if (saved) applyRestoredState(saved);
      }

      await new Promise<void>((resolve, reject) => {
        let active = 0;
        let hasFailed = false;

        const schedule = () => {
          // Propagate failures to downstream tasks before checking slots.
          const justSkipped = this.markSkipped();
          for (const name of justSkipped) {
            onTaskDone?.(name, "skipped");
          }

          // When failFast is set we drain running tasks but start no new ones.
          if (failFast && hasFailed) {
            if (active === 0) finish();
            return;
          }

          const slots = concurrency - active;
          const ready = this.getRunnableTasks().slice(0, slots);

          // Nothing running and nothing ready → we're done (or stuck).
          if (ready.length === 0 && active === 0) {
            finish();
            return;
          }

          for (const task of ready) {
            active++;
            onTaskStart?.(task.name);

            // executeTask is guaranteed never to throw — status is set internally.
            this.executeTask(task).then(async () => {
              active--;

              if (task.status === "failed") {
                hasFailed = true;
                onTaskDone?.(task.name, "failed");
              } else if (task.status === "done") {
                onTaskDone?.(task.name, "done");
              }
              // "pending" means the task was re-queued for a retry — no hook yet.

              await saveState();
              schedule();
            });
          }
        };

        const finish = () => {
          // Tasks stuck in "pending" signal a circular or missing dependency.
          const stuck = [...this.tasks.values()].filter(
            (t) => t.status === "pending"
          );
          if (stuck.length > 0) {
            reject(
              new Error(
                `Tasks could not be scheduled (circular or missing dependency): ` +
                  stuck.map((t) => t.name).join(", ")
              )
            );
            return;
          }

          const failed = [...this.tasks.values()].filter(
            (t) => t.status === "failed"
          );
          if (failed.length > 0) {
            reject(
              new Error(
                `Tasks failed: ${failed.map((t) => t.name).join(", ")}`
              )
            );
            return;
          }

          resolve();
        };

        schedule();
      });

      if (store && clearOnSuccess) {
        await store.clear();
      }
    };

    return runAsync();
  }

  private getRunnableTasks(): Task[] {
    return [...this.tasks.values()].filter((task) => {
      if (task.status !== "pending") return false;

      return task.deps.every((dep) => {
        const depTask = this.tasks.get(dep);
        return depTask?.status === "done";
      });
    });
  }

  /**
   * Mark every pending task whose dependency chain contains a failure as
   * "skipped". Runs to a fixed point so transitive skips propagate in one
   * call (A fails → B skips → C skips).
   *
   * Returns the names of tasks that were just marked skipped.
   */
  private markSkipped(): string[] {
    const justSkipped: string[] = [];
    let changed = true;

    while (changed) {
      changed = false;
      for (const task of this.tasks.values()) {
        if (task.status !== "pending") continue;

        const isBlocked = task.deps.some((dep) => {
          const d = this.tasks.get(dep);
          return d?.status === "failed" || d?.status === "skipped";
        });

        if (isBlocked) {
          task.status = "skipped";
          justSkipped.push(task.name);
          changed = true;
        }
      }
    }

    return justSkipped;
  }

  private async executeTask(task: Task): Promise<void> {
    task.status = "running";
    task.attempts++;

    try {
      await task.fn();
      task.status = "done";
    } catch (err) {
      task.error = err;
      if (task.attempts <= task.retries) {
        task.status = "pending"; // re-queued for retry
      } else {
        task.status = "failed";
      }
    }
  }

  getStatus(): Record<string, TaskStatus> {
    const status: Record<string, TaskStatus> = {};

    for (const [name, task] of this.tasks) {
      status[name] = task.status;
    }

    return status;
  }
}
