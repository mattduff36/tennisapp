export function durationMs(
  startedAt: string,
  now: Date = new Date(),
): number {
  const started = Date.parse(startedAt);
  if (Number.isNaN(started)) {
    return 0;
  }

  return Math.max(0, now.getTime() - started);
}

/** Compact human duration: `45s`, `12m`, `3h 5m`. */
export function formatDuration(
  startedAt: string,
  now: Date = new Date(),
): string {
  const totalSeconds = Math.floor(durationMs(startedAt, now) / 1000);

  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const totalMinutes = Math.floor(totalSeconds / 60);
  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}
