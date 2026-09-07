import type { SessionView } from "./session-view";

export function buildSessionTickerSegments(view: SessionView): string[] {
  const longest = view.waiting[0];
  const segments: string[] = [
    longest
      ? `Waiting: ${view.waitingCount} · Longest wait: ${longest.name} ${longest.waitLabel}`
      : `Waiting: ${view.waitingCount} · Longest wait: —`,
  ];

  for (const court of view.courts) {
    if (court.occupied) {
      const names = court.players.map((player) => player.name).join(", ");
      segments.push(
        court.durationLabel
          ? `${court.name}: ${names} · ${court.durationLabel}`
          : `${court.name}: ${names}`,
      );
      continue;
    }
    segments.push(`${court.name}: free`);
  }

  for (const player of view.waiting) {
    segments.push(`${player.name} waiting ${player.waitLabel}`);
  }

  return segments;
}
