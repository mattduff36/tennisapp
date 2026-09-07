"use client";

import { TennisBall } from "@/features/pegboard/graphics/tennis-ball";
import { buildSessionTickerSegments } from "../model/session-stats";
import type { SessionView } from "../model/session-view";

function TickerTrack({ segments }: { segments: string[] }) {
  return (
    <div className="stats-ticker-track">
      {segments.map((segment, index) => (
        <span key={`${segment}-${index}`} className="stats-ticker-item">
          {index > 0 ? <span className="stats-ticker-sep" aria-hidden="true" /> : null}
          <span className="stats-ticker-text">{segment}</span>
        </span>
      ))}
      <TennisBall className="stats-ticker-ball" decorative />
    </div>
  );
}

export function SessionTicker({ view }: { view: SessionView }) {
  const segments = buildSessionTickerSegments(view);

  return (
    <div className="stats-ticker play-ticker" aria-hidden="true">
      <div className="stats-ticker-viewport">
        <div className="stats-ticker-rail">
          <TickerTrack segments={segments} />
          <TickerTrack segments={segments} />
        </div>
      </div>
    </div>
  );
}
