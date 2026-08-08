"use client";

import { TennisBall } from "../graphics/tennis-ball";
import type { PlayerDragSession } from "../drag/player-drag";

export function DragGhost({ session }: { session: PlayerDragSession }) {
  if (!session.active) {
    return null;
  }

  return (
    <div
      className="drag-ghost"
      style={{
        transform: `translate(${session.x + 12}px, ${session.y + 12}px)`,
      }}
      aria-hidden="true"
    >
      <TennisBall className="player-ball" />
      <span>{session.name}</span>
    </div>
  );
}
