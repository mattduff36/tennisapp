"use client";

import { useEffect, useState } from "react";
import { TennisBall } from "../graphics/tennis-ball";
import type { BoardState } from "../model/board";
import { buildTickerSegments } from "../model/board-stats";

const TICKER_REFRESH_MS = 30_000;

function TickerTrack({ segments }: { segments: string[] }) {
  return (
    <div className="stats-ticker-track">
      {segments.map((segment, index) => (
        <span key={`${segment}-${index}`} className="stats-ticker-item">
          {index > 0 ? (
            <TennisBall className="stats-ticker-ball" decorative />
          ) : null}
          <span className="stats-ticker-text">{segment}</span>
        </span>
      ))}
      <TennisBall className="stats-ticker-ball" decorative />
    </div>
  );
}

export function StatsTicker({ board }: { board: BoardState }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(new Date());
    }, TICKER_REFRESH_MS);

    return () => window.clearInterval(id);
  }, []);

  const segments = buildTickerSegments(board, now);

  return (
    <div className="stats-ticker" aria-hidden="true">
      <div className="stats-ticker-viewport">
        <div className="stats-ticker-rail">
          <TickerTrack segments={segments} />
          <TickerTrack segments={segments} />
        </div>
      </div>
    </div>
  );
}
