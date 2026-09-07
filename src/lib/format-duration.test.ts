import { describe, expect, it } from "vitest";
import { durationMs, formatDuration } from "./format-duration";

const NOW = new Date("2026-08-08T12:00:00.000Z");

describe("format duration", () => {
  it("clamps clock skew and formats boundaries", () => {
    expect(durationMs("2026-08-08T12:01:00.000Z", NOW)).toBe(0);
    expect(formatDuration("2026-08-08T11:59:15.000Z", NOW)).toBe("45s");
    expect(formatDuration("2026-08-08T11:48:00.000Z", NOW)).toBe("12m");
    expect(formatDuration("2026-08-08T09:00:00.000Z", NOW)).toBe("3h");
    expect(formatDuration("2026-08-08T08:45:00.000Z", NOW)).toBe("3h 15m");
  });
});
