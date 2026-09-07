import { describe, expect, it } from "vitest";
import { wizardSetupSummary } from "./session-copy";

describe("wizardSetupSummary", () => {
  it("lists name, game, and court count for the ready screen", () => {
    expect(
      wizardSetupSummary({
        name: "Ada",
        gameMode: "singles",
        courtCount: 1,
      }),
    ).toEqual(["Ada", "Singles · 2 per court", "1 court"]);
    expect(
      wizardSetupSummary({
        name: "  ",
        gameMode: "doubles",
        courtCount: 4,
      }),
    ).toEqual(["Your name", "Doubles · 4 per court", "4 courts"]);
  });
});
