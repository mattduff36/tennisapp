import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
  handleDoneSession,
  handleJoinSession,
  handlePatchSettings,
  handleReadySession,
  handleResetSession,
} from "../api/session-handlers";
import { createNeonSessionRepository } from "./neon-session-repository";

function loadDatabaseUrl(): string | null {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  try {
    const envFile = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of envFile.split(/\r?\n/)) {
      if (line.startsWith("DATABASE_URL=")) {
        return line.slice("DATABASE_URL=".length).trim();
      }
    }
  } catch {
    return null;
  }
  return null;
}

const databaseUrl = loadDatabaseUrl();
if (databaseUrl && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = databaseUrl;
}

const describeDb = databaseUrl ? describe : describe.skip;

describeDb("neon session repository", () => {
  const repository = createNeonSessionRepository();

  afterAll(async () => {
    await handleResetSession(repository);
  });

  it("SESSION-READY-03 / persist: concurrent Ready cannot share players; done rewrites waiting rows", async () => {
    await handleResetSession(repository);
    await handlePatchSettings(repository, { gameMode: "doubles", courtCount: 3 });
    const tokens = [
      crypto.randomUUID(),
      crypto.randomUUID(),
      crypto.randomUUID(),
      crypto.randomUUID(),
    ];
    const names = ["DbAda", "DbBea", "DbCara", "DbDee"];
    for (const [index, token] of tokens.entries()) {
      const joined = await handleJoinSession(repository, {
        token,
        name: names[index],
      });
      expect(joined.status).toBe(200);
    }

    const [first, second] = await Promise.all([
      handleReadySession(repository, { token: tokens[0] }),
      handleReadySession(repository, { token: tokens[1] }),
    ]);
    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([200, 409]);
    const winner = first.status === 200 ? first : second;
    if (!("me" in winner.body) || !winner.body.me) {
      throw new Error("winner should include assignment");
    }
    expect(winner.body.me.status).toBe("on_court");
    expect(winner.body.me.partners).toHaveLength(3);

    const done = await handleDoneSession(repository, { token: tokens[0] });
    expect(done.status).toBe(200);
    if (!("waiting" in done.body)) {
      throw new Error("done should return view");
    }
    expect(done.body.waiting).toHaveLength(4);
    expect(done.body.courts.every((court) => !court.occupied)).toBe(true);
  });
});
