import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadTextSize, saveTextSize } from "./text-size-storage";
import {
  DEFAULT_TEXT_SIZE,
  TEXT_SIZE_STORAGE_KEY,
  applyTextSizeToDocument,
  isTextSize,
  textSizeFromIndex,
  textSizeIndex,
} from "./text-size";

describe("text size preference", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-text-size");
    document.documentElement.style.fontSize = "";
  });

  afterEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-text-size");
    document.documentElement.style.fontSize = "";
  });

  it("TEXT-01: maps five discrete steps and validates sizes", () => {
    expect(textSizeIndex("smallest")).toBe(0);
    expect(textSizeIndex("largest")).toBe(4);
    expect(textSizeFromIndex(2)).toBe("normal");
    expect(textSizeFromIndex(99)).toBe("largest");
    expect(textSizeFromIndex(-3)).toBe("smallest");
    expect(isTextSize("large")).toBe(true);
    expect(isTextSize("huge")).toBe(false);
  });

  it("TEXT-02: persists preference and applies root scale", () => {
    expect(loadTextSize()).toBe(DEFAULT_TEXT_SIZE);
    saveTextSize("large");
    expect(window.localStorage.getItem(TEXT_SIZE_STORAGE_KEY)).toBe("large");
    expect(loadTextSize()).toBe("large");

    applyTextSizeToDocument("largest");
    expect(document.documentElement.dataset.textSize).toBe("largest");
    expect(document.documentElement.style.fontSize).toBe("125%");
  });

  it("TEXT-02: ignores corrupt stored values", () => {
    window.localStorage.setItem(TEXT_SIZE_STORAGE_KEY, "not-a-size");
    expect(loadTextSize()).toBe(DEFAULT_TEXT_SIZE);
  });
});
