"use client";

import { useCallback, useEffect, useState } from "react";
import { CourtCard } from "./components/court-card";
import { PlayerManager } from "./components/player-manager";
import { StatusBar } from "./components/status-bar";
import { WaitingList } from "./components/waiting-list";
import { CourtMarkings } from "./graphics/court-markings";
import { TennisBall } from "./graphics/tennis-ball";
import { usePegboard } from "./hooks/use-pegboard";

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reduced;
}

export function PegboardApp() {
  const pegboard = usePegboard();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [animatingCourtId, setAnimatingCourtId] = useState<number | null>(null);
  const [waitingPulse, setWaitingPulse] = useState(false);

  const handleAssign = useCallback(
    (courtId: 1 | 2 | 3) => {
      const changed = pegboard.assignSelectedToCourt(courtId);
      if (changed && !prefersReducedMotion) {
        setAnimatingCourtId(courtId);
        window.setTimeout(() => setAnimatingCourtId(null), 420);
      }
    },
    [pegboard, prefersReducedMotion],
  );

  const handleReturn = useCallback(
    (playerId: string) => {
      pegboard.returnToWaiting(playerId);
      if (!prefersReducedMotion) {
        setWaitingPulse(true);
        window.setTimeout(() => setWaitingPulse(false), 420);
      }
    },
    [pegboard, prefersReducedMotion],
  );

  const handleRename = useCallback(
    (playerId: string, currentName: string) => {
      const next = window.prompt("Rename player", currentName);
      if (next === null) {
        return;
      }
      pegboard.renamePlayer(playerId, next);
    },
    [pegboard],
  );

  const handleDelete = useCallback(
    (playerId: string, currentName: string) => {
      const confirmed = window.confirm(
        `Delete ${currentName} from the board? This cannot be undone.`,
      );
      if (!confirmed) {
        return;
      }
      pegboard.deletePlayer(playerId);
    },
    [pegboard],
  );

  const handleReset = useCallback(() => {
    const confirmed = window.confirm(
      "Reset the local board? This clears all players saved in this browser.",
    );
    if (!confirmed) {
      return;
    }
    void pegboard.resetLocalBoard();
  }, [pegboard]);

  return (
    <div className="pegboard-shell">
      <header className="app-header">
        <div className="brand">
          <TennisBall className="brand-ball" />
          <div>
            <p className="scoreboard-label">Club pegboard</p>
            <h1>Tennis Court Board</h1>
          </div>
        </div>
        <PlayerManager
          disabled={!pegboard.canInteract}
          onAdd={pegboard.addPlayer}
        />
      </header>

      <StatusBar
        selectedPlayerName={pegboard.selectedPlayerName}
        notice={pegboard.notice}
        persistenceStatus={pegboard.persistenceStatus}
        storageMessage={pegboard.storageMessage}
        onDismissNotice={pegboard.dismissNotice}
        onReset={handleReset}
        canInteract={pegboard.canInteract}
      />

      <div className="board-stage">
        <div className="stage-backdrop" aria-hidden="true">
          <CourtMarkings className="stage-lines" />
        </div>

        <div className="board-grid">
          <div className={waitingPulse ? "waiting-bounce" : undefined}>
            <WaitingList
              players={pegboard.waitingPlayers}
              selectedPlayerId={pegboard.selectedPlayerId}
              disabled={!pegboard.canInteract}
              onSelect={pegboard.selectWaitingPlayer}
              onRename={handleRename}
              onDelete={handleDelete}
            />
          </div>

          <div className="courts-column" aria-label="On Court">
            <div className="on-court-heading">
              <h2>On Court</h2>
              <p>Three courts · 2–4 players preferred · 1 marked incomplete</p>
            </div>
            <div className="courts-grid">
              {pegboard.courts.map((court) => (
                <div
                  key={court.courtId}
                  className={
                    animatingCourtId === court.courtId ? "court-bounce" : undefined
                  }
                >
                  <CourtCard
                    courtId={court.courtId}
                    players={court.players}
                    isIncomplete={court.isIncomplete}
                    isFull={court.isFull}
                    disabled={!pegboard.canInteract}
                    canReceive={Boolean(pegboard.selectedPlayerId) && !court.isFull}
                    onAssign={handleAssign}
                    onReturn={handleReturn}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
