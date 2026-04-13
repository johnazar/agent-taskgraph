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

## 📊 Status tracking

```ts
graph.getStatus();
```

```json
{
  "install": "done",
  "build": "running",
  "start": "pending"
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

* [ ] Parallel execution
* [ ] Persistent state (resume after crash)
* [ ] Event hooks (`onTaskStart`)
* [ ] CLI interface

---

## 🧠 Philosophy

Don’t build smarter agents.

Build agents that **don’t break**.

---

## ⭐ If this helps you…

Give it a star.
Or better—use it in your agent and break it 😈
