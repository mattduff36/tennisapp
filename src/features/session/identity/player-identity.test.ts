import { describe, expect, it } from "vitest";
import {
  clearPlayerIdentity,
  parsePlayerIdentity,
  PLAYER_IDENTITY_KEY,
  readPlayerIdentity,
  writePlayerIdentity,
} from "./player-identity";

describe("player identity", () => {
  it("parses versioned identity and rejects junk", () => {
    expect(
      parsePlayerIdentity({ version: 2, token: "tok", name: "Ada" }),
    ).toEqual({ version: 2, token: "tok", name: "Ada" });
    expect(
      parsePlayerIdentity({ version: 1, id: "abc", name: "Ada" }),
    ).toEqual({ version: 2, token: "abc", name: "Ada" });
    expect(parsePlayerIdentity({ version: 3, token: "tok", name: "Ada" })).toBeNull();
    expect(parsePlayerIdentity({ version: 2, token: "", name: "Ada" })).toBeNull();
  });

  it("reads and writes localStorage", () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    };

    writePlayerIdentity({ version: 2, token: "a", name: "Ada" }, storage);
    expect(store.get(PLAYER_IDENTITY_KEY)).toContain("Ada");
    expect(readPlayerIdentity(storage)).toEqual({
      version: 2,
      token: "a",
      name: "Ada",
    });
    clearPlayerIdentity(storage);
    expect(readPlayerIdentity(storage)).toBeNull();
  });
});
