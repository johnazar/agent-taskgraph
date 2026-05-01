# ⚡ Agent-taskgraph

> Stop letting AI agents run your app like chaos monkeys.

A tiny task execution engine that makes AI agents **reliable, resumable, and predictable**.

---

## 🤯 The problem

AI agents are great at *thinking*…

…but terrible at *execution*.

They:

* Repeat the same steps
* Run things in the wrong order
* Break halfway and start over
* Forget what they already did

Result?

💥 Fragile apps
💥 Wasted tokens
💥 Infinite loops

---

## ✅ The fix

`agent-taskgraph` gives your agent a **structured execution engine**.

Instead of chaos:

```ts
await install();
await build();
await start();
```

You get:

```ts
graph.addTask("install", install);
graph.addTask("build", build, ["install"]);
graph.addTask("start", start, ["build"]);

await graph.run();
```

✔ Runs in correct order
✔ Retries on failure
✔ Never repeats completed work
✔ Knows what’s done / pending

---

## 🧠 Built for AI agents

This is not a workflow tool for humans.

It’s designed for:

* autonomous coding agents
* CLI copilots
* app-building bots

---

## 🚀 Install

```bash
npm install agent-taskgraph
```

---

## ⚡ Example

```ts
import { TaskGraph } from "agent-taskgraph";

const graph = new TaskGraph();

graph.addTask("install", async () => {
  console.log("Installing deps...");
});

graph.addTask("build", async () => {
  console.log("Building app...");
}, ["install"]);

graph.addTask("start", async () => {
  console.log("Starting server...");
}, ["build"]);

await graph.run();

console.log(graph.getStatus());
```

---

## 🔁 Retries (because agents fail 😅)

```ts
graph.addTask("install", installDeps, [], { retries: 2 });
```

---

## ⚡ Parallel execution

Tasks run in parallel automatically — as soon as their dependencies are satisfied.

```ts
import { TaskGraph } from "agent-taskgraph";

const graph = new TaskGraph();

// These two have no deps — they run at the same time
graph.addTask("fetch-data",   fetchData);
graph.addTask("fetch-config", fetchConfig);

// Waits for both fetches to finish, then runs
graph.addTask("process", process, ["fetch-data", "fetch-config"]);

// These two both depend only on "process" — they run in parallel
graph.addTask("summarize", summarize, ["process"]);
graph.addTask("notify",    notify,    ["process"]);

await graph.run();
```

### Concurrency limit

Cap how many tasks run simultaneously:

```ts
await graph.run({ concurrency: 3 }); // at most 3 tasks at once
```

Pass `concurrency: 1` to restore fully sequential behaviour.

### Stop on first failure

```ts
await graph.run({ failFast: true }); // drain running tasks, then stop
```

By default (`failFast: false`) execution continues — all tasks that *can* run do run, and blocked downstream tasks are marked `"skipped"`.

---

## 🪝 Event hooks

```ts
await graph.run({
  concurrency: 3,
  onTaskStart: (name) => console.log(`▶ ${name} started`),
  onTaskDone:  (name, status) => console.log(`✓ ${name} → ${status}`),
});
```

`onTaskDone` fires with `"done"`, `"failed"`, or `"skipped"`. It does **not** fire between retry attempts — use `onTaskStart` to track those.

---

## 📊 Status tracking

```ts
graph.getStatus();
```

```json
{
  "fetch-data":   "done",
  "fetch-config": "done",
  "process":      "done",
  "summarize":    "done",
  "notify":       "skipped"
}
```

Possible statuses:

| Status | Meaning |
|---|---|
| `pending` | Waiting for dependencies or a retry slot |
| `running` | Currently executing |
| `done` | Completed successfully |
| `failed` | Exhausted all retries |
| `skipped` | A dependency failed or was skipped — never ran |

---

## 💾 Persistent state (resume after crash)

If the process crashes mid-run, pick up exactly where you left off — already-completed tasks are skipped automatically.

```ts
import { TaskGraph, FileStateStore } from "agent-taskgraph";

const graph = new TaskGraph();

graph.addTask("fetch",   fetchData);
graph.addTask("process", processData, ["fetch"]);
graph.addTask("save",    saveResults, ["process"]);

await graph.run({
  store: new FileStateStore("./run-state.json"),
  clearOnSuccess: true, // delete the file after a clean run (default: true)
});
```

On crash, re-run the same code — the engine reads `run-state.json` and skips tasks that already finished.

### What gets restored

| Persisted status | Retry budget | Resumes as |
|---|---|---|
| `done` | — | skipped (won\'t re-run) |
| `running` (crashed) | remaining | `pending` (retried) |
| `running` (crashed) | exhausted | `failed` |
| `failed` | remaining | `pending` (retried) |
| `failed` | exhausted | `failed` |
| `pending` / `skipped` | — | `pending` (fresh start) |

### Custom store

Implement the `StateStore` interface to persist anywhere (Redis, SQLite, S3, …):

```ts
import { StateStore, PersistedState } from "agent-taskgraph";

class MyStore implements StateStore {
  async load(): Promise<PersistedState | null> { /* ... */ }
  async save(state: PersistedState): Promise<void> { /* ... */ }
  async clear(): Promise<void> { /* ... */ }
}
```

---

## 🧩 Why this matters

If you're building AI agents, you need:

* Deterministic execution
* Failure recovery
* Progress tracking

Otherwise your agent is just guessing.

---

## 🔥 Use cases

* “Build me an API” agents
* Codegen pipelines
* Dev automation bots
* Self-healing scripts

---

## 🛣 Roadmap

* [x] Parallel execution
* [x] Event hooks (`onTaskStart`, `onTaskDone`)
* [x] Persistent state (resume after crash)
* [ ] CLI interface

---

## 🧠 Philosophy

Don’t build smarter agents.

Build agents that **don’t break**.

---

## ⭐ If this helps you…

Give it a star.
Or better—use it in your agent and break it 😈
