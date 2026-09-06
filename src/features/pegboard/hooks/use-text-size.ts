"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { loadTextSize, saveTextSize, subscribeTextSize } from "../text-size/text-size-storage";
import {
  DEFAULT_TEXT_SIZE,
  applyTextSizeToDocument,
  type TextSize,
} from "../text-size/text-size";

export function useTextSize() {
  const textSize = useSyncExternalStore(
    subscribeTextSize,
    loadTextSize,
    () => DEFAULT_TEXT_SIZE,
  );

  useLayoutEffect(() => {
    applyTextSizeToDocument(textSize);
  }, [textSize]);

  function setTextSize(next: TextSize) {
    applyTextSizeToDocument(next);
    saveTextSize(next);
  }

  return { textSize, setTextSize };
}
