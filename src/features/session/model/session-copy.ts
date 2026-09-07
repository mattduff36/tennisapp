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
