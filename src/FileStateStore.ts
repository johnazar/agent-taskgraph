// src/FileStateStore.ts

import { rename, readFile, unlink, writeFile } from "node:fs/promises";
import { PersistedState, StateStore } from "./types";

export class FileStateStore implements StateStore {
  constructor(private readonly filePath: string) {}

  async load(): Promise<PersistedState | null> {
    try {
      const raw = await readFile(this.filePath, "utf-8");
      const parsed = JSON.parse(raw) as PersistedState;
      if (parsed?.version !== 1 || typeof parsed.tasks !== "object") {
        return null;
      }
      return parsed;
    } catch (err: unknown) {
      if (isNodeError(err) && err.code === "ENOENT") return null;
      // Treat any other read/parse error as "no valid state"
      return null;
    }
  }

  async save(state: PersistedState): Promise<void> {
    const tmp = `${this.filePath}.tmp`;
    await writeFile(tmp, JSON.stringify(state), "utf-8");
    // Atomic replace — prevents a partial write from corrupting state on crash
    await rename(tmp, this.filePath);
  }

  async clear(): Promise<void> {
    try {
      await unlink(this.filePath);
    } catch (err: unknown) {
      if (isNodeError(err) && err.code === "ENOENT") return;
      throw err;
    }
  }
}

function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && "code" in err;
}
