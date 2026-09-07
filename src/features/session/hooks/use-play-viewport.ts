"use client";

import { useEffect, type RefObject } from "react";
import { applyPlayViewport } from "../model/play-viewport";

export function usePlayViewport(shellRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) {
      return;
    }

    let wasOpen = false;

    const sync = () => {
      const vv = window.visualViewport;
      const fit = applyPlayViewport(shell, {
        visualHeight: vv?.height ?? window.innerHeight,
        layoutHeight: window.innerHeight,
        offsetTop: vv?.offsetTop ?? 0,
      });

      if (fit.keyboardOpen && !wasOpen) {
        const active = document.activeElement;
        if (
          active instanceof HTMLElement &&
          shell.contains(active) &&
          (active instanceof HTMLInputElement ||
            active instanceof HTMLTextAreaElement)
        ) {
          requestAnimationFrame(() => {
            active.scrollIntoView({ block: "nearest", inline: "nearest" });
          });
        }
      }
      wasOpen = fit.keyboardOpen;
    };

    sync();
    const vv = window.visualViewport;
    vv?.addEventListener("resize", sync);
    vv?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    return () => {
      vv?.removeEventListener("resize", sync);
      vv?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [shellRef]);
}
