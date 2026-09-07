import type { GameMode, ReadyRule } from "./session";
import type { SessionView } from "./session-view";

export function readyButtonLabel(view: SessionView): string {
  if (view.canStart) {
    return "Players ready";
  }
  if (view.startBlockedReason === "no_free_court") {
    return "All courts in use";
  }
  return view.playersNeeded === 1
    ? "Need 1 more"
    : `Need ${view.playersNeeded} more`;
}

export function readyConfirmCopy(
  readyRule: ReadyRule,
  surface: "phone" | "board",
): string {
  if (surface === "phone") {
    return readyRule === "random"
      ? "Start a court with you plus random players?"
      : "Start a court with you plus the longest-waiting players?";
  }
  return readyRule === "random"
    ? "Start a court with random waiting players?"
    : "Start a court with the longest-waiting players?";
}

export function courtDensityForCount(count: number): "comfortable" | "compact" {
  return count >= 5 ? "compact" : "comfortable";
}

export function wizardSetupSummary(input: {
  name: string;
  gameMode: GameMode;
  courtCount: number;
}): string[] {
  const name = input.name.trim() || "Your name";
  const game =
    input.gameMode === "singles"
      ? "Singles · 2 per court"
      : "Doubles · 4 per court";
  const courts =
    input.courtCount === 1 ? "1 court" : `${input.courtCount} courts`;
  return [name, game, courts];
}
