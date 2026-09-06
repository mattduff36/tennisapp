import {
  DEFAULT_TEXT_SIZE,
  TEXT_SIZE_STORAGE_KEY,
  isTextSize,
  type TextSize,
} from "./text-size";

const TEXT_SIZE_EVENT = "tennisapp-text-size";

export function subscribeTextSize(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(TEXT_SIZE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(TEXT_SIZE_EVENT, onStoreChange);
  };
}

export function loadTextSize(): TextSize {
  if (typeof window === "undefined") {
    return DEFAULT_TEXT_SIZE;
  }

  try {
    const raw = window.localStorage.getItem(TEXT_SIZE_STORAGE_KEY);
    if (isTextSize(raw)) {
      return raw;
    }
  } catch {
    // Ignore storage failures and fall back to default.
  }

  return DEFAULT_TEXT_SIZE;
}

export function saveTextSize(size: TextSize): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(TEXT_SIZE_STORAGE_KEY, size);
    window.dispatchEvent(new Event(TEXT_SIZE_EVENT));
  } catch {
    // Preference is best-effort; board persistence is separate.
  }
}
