export const TEXT_SIZES = [
  "smallest",
  "small",
  "normal",
  "large",
  "largest",
] as const;

export type TextSize = (typeof TEXT_SIZES)[number];

export const DEFAULT_TEXT_SIZE: TextSize = "normal";

export const TEXT_SIZE_LABELS: Record<TextSize, string> = {
  smallest: "Smallest",
  small: "Small",
  normal: "Normal",
  large: "Large",
  largest: "Largest",
};

/** Root html font-size scale relative to the browser default. */
export const TEXT_SIZE_SCALE: Record<TextSize, number> = {
  smallest: 0.875,
  small: 0.9375,
  normal: 1,
  large: 1.125,
  largest: 1.25,
};

export const TEXT_SIZE_STORAGE_KEY = "tennisapp.text-size.v1";

export function isTextSize(value: unknown): value is TextSize {
  return (
    typeof value === "string" &&
    (TEXT_SIZES as readonly string[]).includes(value)
  );
}

export function textSizeIndex(size: TextSize): number {
  return TEXT_SIZES.indexOf(size);
}

export function textSizeFromIndex(index: number): TextSize {
  const clamped = Math.min(
    TEXT_SIZES.length - 1,
    Math.max(0, Math.round(index)),
  );
  return TEXT_SIZES[clamped]!;
}

export function applyTextSizeToDocument(size: TextSize): void {
  if (typeof document === "undefined") {
    return;
  }
  const root = document.documentElement;
  root.dataset.textSize = size;
  root.style.fontSize = `${TEXT_SIZE_SCALE[size] * 100}%`;
}
