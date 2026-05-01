# agent-taskgraph demo

A minimal TypeScript project showing how to use [agent-taskgraph](https://www.npmjs.com/package/agent-taskgraph).

## Pipeline

```
fetchData ──┐
            ├──▶ validateData ──▶ transform ──▶ saveResults
loadConfig ─┘                              └──▶ sendReport
```

- `fetchData` and `loadConfig` run in **parallel** (no deps).
- `validateData` starts once **both** finish.
- `transform` runs after validation, with **1 automatic retry** on failure.
- `saveResults` and `sendReport` run in **parallel** after transform.

## Quick start

```bash
npm install
npm run dev
```

## What it demonstrates

| Feature | Where |
|---|---|
| `addTask(name, fn, deps)` | every task |
| Parallel execution | `fetchData` + `loadConfig`; `saveResults` + `sendReport` |
| `concurrency` limit | `graph.run({ concurrency: 3 })` |
| `retries` option | `transform` task |
| `onTaskStart` / `onTaskDone` hooks | `graph.run(...)` options |
