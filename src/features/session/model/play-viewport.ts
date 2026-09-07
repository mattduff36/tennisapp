export const KEYBOARD_INSET_PX = 150;
export const FULL_BUTTON_MIN_PX = 88;
export const ROOMY_BUTTON_MIN_PX = 64;
export const COMPACT_BUTTON_MIN_PX = 52;
export const TIGHT_VIEWPORT_PX = 520;
export const VERY_TIGHT_VIEWPORT_PX = 400;

export type PlayViewportMetrics = {
  visualHeight: number;
  layoutHeight: number;
  offsetTop: number;
};

export type PlayViewportFit = {
  keyboardOpen: boolean;
  compact: boolean;
  hideTicker: boolean;
  buttonMinHeightPx: number;
  dockPadPx: number;
};

export function isKeyboardOpen(layoutHeight: number, visualHeight: number): boolean {
  return layoutHeight - visualHeight >= KEYBOARD_INSET_PX;
}

export function fitPlayDockToViewport({
  visualHeight,
  layoutHeight,
}: Pick<PlayViewportMetrics, "visualHeight" | "layoutHeight">): PlayViewportFit {
  const keyboardOpen = isKeyboardOpen(layoutHeight, visualHeight);

  if (!keyboardOpen) {
    return {
      keyboardOpen: false,
      compact: false,
      hideTicker: false,
      buttonMinHeightPx: FULL_BUTTON_MIN_PX,
      dockPadPx: 12,
    };
  }

  if (visualHeight < VERY_TIGHT_VIEWPORT_PX) {
    return {
      keyboardOpen: true,
      compact: true,
      hideTicker: true,
      buttonMinHeightPx: COMPACT_BUTTON_MIN_PX,
      dockPadPx: 8,
    };
  }

  if (visualHeight < TIGHT_VIEWPORT_PX) {
    return {
      keyboardOpen: true,
      compact: true,
      hideTicker: true,
      buttonMinHeightPx: ROOMY_BUTTON_MIN_PX,
      dockPadPx: 8,
    };
  }

  return {
    keyboardOpen: true,
    compact: false,
    hideTicker: true,
    buttonMinHeightPx: FULL_BUTTON_MIN_PX,
    dockPadPx: 12,
  };
}

export function applyPlayViewport(
  shell: HTMLElement,
  metrics: PlayViewportMetrics,
): PlayViewportFit {
  const fit = fitPlayDockToViewport(metrics);

  if (fit.keyboardOpen) {
    shell.style.height = `${Math.round(metrics.visualHeight)}px`;
    shell.style.transform = metrics.offsetTop
      ? `translate3d(0, ${Math.round(metrics.offsetTop)}px, 0)`
      : "";
  } else {
    shell.style.height = "";
    shell.style.transform = "";
  }

  shell.style.setProperty("--play-dock-button-min", `${fit.buttonMinHeightPx}px`);
  shell.style.setProperty("--play-dock-pad-y", `${fit.dockPadPx}px`);
  shell.dataset.keyboard = fit.keyboardOpen ? "open" : "closed";
  shell.dataset.dockSize = fit.compact ? "compact" : "full";
  return fit;
}
