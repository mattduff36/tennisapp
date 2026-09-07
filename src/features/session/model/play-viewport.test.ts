import { describe, expect, it } from "vitest";
import {
  COMPACT_BUTTON_MIN_PX,
  FULL_BUTTON_MIN_PX,
  ROOMY_BUTTON_MIN_PX,
  applyPlayViewport,
  fitPlayDockToViewport,
} from "./play-viewport";

describe("play viewport dock fit", () => {
  it("PLAY-VV-01: no keyboard keeps full dock buttons and the ticker", () => {
    expect(
      fitPlayDockToViewport({ visualHeight: 844, layoutHeight: 844 }),
    ).toEqual({
      keyboardOpen: false,
      compact: false,
      hideTicker: false,
      buttonMinHeightPx: FULL_BUTTON_MIN_PX,
      dockPadPx: 12,
    });
    expect(
      fitPlayDockToViewport({ visualHeight: 780, layoutHeight: 844 }),
    ).toMatchObject({ keyboardOpen: false, compact: false });
  });

  it("PLAY-VV-02: keyboard with room keeps large buttons and hides the ticker", () => {
    expect(
      fitPlayDockToViewport({ visualHeight: 560, layoutHeight: 844 }),
    ).toEqual({
      keyboardOpen: true,
      compact: false,
      hideTicker: true,
      buttonMinHeightPx: FULL_BUTTON_MIN_PX,
      dockPadPx: 12,
    });
  });

  it("PLAY-VV-03: keyboard plus a tight viewport shrinks the dock", () => {
    expect(
      fitPlayDockToViewport({ visualHeight: 470, layoutHeight: 844 }),
    ).toEqual({
      keyboardOpen: true,
      compact: true,
      hideTicker: true,
      buttonMinHeightPx: ROOMY_BUTTON_MIN_PX,
      dockPadPx: 8,
    });
  });

  it("PLAY-VV-04: a very short leftover viewport uses the smallest easy tap", () => {
    expect(
      fitPlayDockToViewport({ visualHeight: 360, layoutHeight: 667 }),
    ).toEqual({
      keyboardOpen: true,
      compact: true,
      hideTicker: true,
      buttonMinHeightPx: COMPACT_BUTTON_MIN_PX,
      dockPadPx: 8,
    });
  });

  it("PLAY-VV-05: applyPlayViewport pins the shell to the visual viewport", () => {
    const shell = document.createElement("div");
    applyPlayViewport(shell, {
      visualHeight: 470,
      layoutHeight: 844,
      offsetTop: 12,
    });

    expect(shell.style.height).toBe("470px");
    expect(shell.style.transform).toBe("translate3d(0, 12px, 0)");
    expect(shell.dataset.keyboard).toBe("open");
    expect(shell.dataset.dockSize).toBe("compact");
    expect(shell.style.getPropertyValue("--play-dock-button-min")).toBe("64px");

    applyPlayViewport(shell, {
      visualHeight: 844,
      layoutHeight: 844,
      offsetTop: 0,
    });
    expect(shell.style.height).toBe("");
    expect(shell.style.transform).toBe("");
    expect(shell.dataset.keyboard).toBe("closed");
    expect(shell.dataset.dockSize).toBe("full");
  });
});
