import { describe, expect, it } from "vitest";
import { isPhoneUserAgent } from "./is-phone";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const ANDROID_PHONE =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
const IPAD =
  "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const ANDROID_TABLET =
  "Mozilla/5.0 (Linux; Android 13; SM-X810) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const DESKTOP =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

describe("isPhoneUserAgent", () => {
  it("DEVICE-PHONE-01: phones match; tablets and desktop do not", () => {
    expect(isPhoneUserAgent(IPHONE)).toBe(true);
    expect(isPhoneUserAgent(ANDROID_PHONE)).toBe(true);
    expect(isPhoneUserAgent(IPAD)).toBe(false);
    expect(isPhoneUserAgent(ANDROID_TABLET)).toBe(false);
    expect(isPhoneUserAgent(DESKTOP)).toBe(false);
    expect(isPhoneUserAgent("")).toBe(false);
    expect(isPhoneUserAgent(null)).toBe(false);
  });
});
