"use client";

import { useEffect, useState } from "react";
import { loadTextSize, saveTextSize } from "../text-size/text-size-storage";
import {
  DEFAULT_TEXT_SIZE,
  applyTextSizeToDocument,
  type TextSize,
} from "../text-size/text-size";

export function useTextSize() {
  const [textSize, setTextSizeState] = useState<TextSize>(DEFAULT_TEXT_SIZE);

  useEffect(() => {
    const stored = loadTextSize();
    setTextSizeState(stored);
    applyTextSizeToDocument(stored);
  }, []);

  function setTextSize(next: TextSize) {
    setTextSizeState(next);
    applyTextSizeToDocument(next);
    saveTextSize(next);
  }

  return { textSize, setTextSize };
}
