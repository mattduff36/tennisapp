import { describe, expect, it } from "vitest";
import {
  isValidPin,
  pinAccessFrom,
  readCookieValue,
} from "./settings-pin";

describe("settings pin helpers", () => {
  it("accepts 4 to 8 digits only", () => {
    expect(isValidPin("1234")).toBe(true);
    expect(isValidPin("12345678")).toBe(true);
    expect(isValidPin("123")).toBe(false);
    expect(isValidPin("123456789")).toBe(false);
    expect(isValidPin("12ab")).toBe(false);
  });

  it("reads the unlock cookie and treats a matching token as unlocked", () => {
    expect(
      readCookieValue("other=1; tennisapp.settings.unlock=abc", "tennisapp.settings.unlock"),
    ).toBe("abc");
    expect(
      pinAccessFrom(
        { hash: "h", salt: "s", unlockToken: "abc" },
        "abc",
      ),
    ).toEqual({ enabled: true, unlocked: true });
    expect(
      pinAccessFrom(
        { hash: "h", salt: "s", unlockToken: "abc" },
        "nope",
      ),
    ).toEqual({ enabled: true, unlocked: false });
    expect(
      pinAccessFrom({ hash: null, salt: null, unlockToken: null }, null),
    ).toEqual({ enabled: false, unlocked: true });
  });
});
