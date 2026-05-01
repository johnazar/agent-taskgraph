import { TaskGraph, FileStateStore } from "agent-taskgraph";
import { existsSync } from "node:fs";

// Simulate async work with a delay
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

// Helper to log with a timestamp prefix
const log = (msg: string) => {
  const t = new Date().toISOString().slice(11, 23);
  console.log(`[${t}] ${msg}`);
};

async function main() {
  const graph = new TaskGraph();

  // ── Task definitions ──────────────────────────────────────────────────────

  // "fetchData" and "loadConfig" have no dependencies — they run immediately in parallel.
  graph.addTask("fetchData", async () => {
    log("fetchData  → fetching remote data…");
    await delay(1400);
    log("fetchData  ✓ done");
  });

  graph.addTask("loadConfig", async () => {
    log("loadConfig → reading config file…");
    await delay(1200);
    log("loadConfig ✓ done");
  });

  // "validateData" waits for both fetchData and loadConfig.
  graph.addTask(
    "validateData",
    async () => {
      log("validate   → validating data against config…");
      await delay(1300);
      log("validate   ✓ done");
    },
    ["fetchData", "loadConfig"]
  );

  // "transform" depends only on validateData.
  graph.addTask(
    "transform",
    async () => {
      log("transform  → transforming records…");
      await delay(1350);
      log("transform  ✓ done");
    },
    ["validateData"],
    { retries: 1 } // retry once on failure
  );

  // "saveResults" and "sendReport" both depend on transform and run in parallel.
  graph.addTask(
    "saveResults",
    async () => {
      log("save       → writing results to DB…");
      await delay(1250);
      log("save       ✓ done");
    },
    ["transform"]
  );

  graph.addTask(
    "sendReport",
    async () => {
      log("report     → sending summary email…");
      await delay(1150);
      log("report     ✓ done");
    },
    ["transform"]
  );

  // ── Execution ─────────────────────────────────────────────────────────────

  const STATE_FILE = "./run-state.json";
  const store = new FileStateStore(STATE_FILE);
  const isResume = existsSync(STATE_FILE);

  console.log("=== agent-taskgraph demo ===\n");
  if (isResume) {
    console.log("↺ Resuming from saved state…\n");
  }

  await graph.run({
    concurrency: 3, // at most 3 tasks at once
    store,
    clearOnSuccess: true,
    onTaskStart: (name) => log(`▶ starting "${name}"`),
    onTaskDone: (name, status) => log(`■ "${name}" → ${status}`),
  });

  console.log("\nAll tasks completed successfully.");
}

main().catch((err) => {
  console.error("\nPipeline failed:", err.message);
  process.exit(1);
});
