"use client";

import { useCallback, useEffect, useState } from "react";
import { CourtCard } from "./components/court-card";
import { DragGhost } from "./components/drag-ghost";
import { PlayerManager } from "./components/player-manager";
import { StatsTicker } from "./components/stats-ticker";
import { StatusBar } from "./components/status-bar";
import { TextSizeControl } from "./components/text-size-control";
import { WaitingList } from "./components/waiting-list";
import { usePlayerDrag } from "./drag/use-player-drag";
import { TennisBall } from "./graphics/tennis-ball";
import { usePegboard } from "./hooks/use-pegboard";
import { useTextSize } from "./hooks/use-text-size";

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
  const { textSize, setTextSize } = useTextSize();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [animatingCourtId, setAnimatingCourtId] = useState<number | null>(null);
  const [waitingPulse, setWaitingPulse] = useState(false);

  const handleAssignPlayer = useCallback(
    (playerId: string, courtId: 1 | 2 | 3) => {
      const changed = pegboard.assignPlayerToCourt(playerId, courtId);
      if (changed && !prefersReducedMotion) {
        setAnimatingCourtId(courtId);
        window.setTimeout(() => setAnimatingCourtId(null), 420);
      }
      return changed;
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

  const drag = usePlayerDrag({
    disabled: !pegboard.canInteract,
    onDropToCourt: handleAssignPlayer,
    onDropToWaiting: handleReturn,
  });

  const handleAssignSelected = useCallback(
    (courtId: 1 | 2 | 3) => {
      if (drag.shouldSuppressClick()) {
        return;
      }
      const changed = pegboard.assignSelectedToCourt(courtId);
      if (changed && !prefersReducedMotion) {
        setAnimatingCourtId(courtId);
        window.setTimeout(() => setAnimatingCourtId(null), 420);
      }
    },
    [drag, pegboard, prefersReducedMotion],
  );

  const handleSelect = useCallback(
    (playerId: string) => {
      if (drag.shouldSuppressClick()) {
        return;
      }
      pegboard.selectWaitingPlayer(playerId);
    },
    [drag, pegboard],
  );

  const handleReturnClick = useCallback(
    (playerId: string) => {
      if (drag.shouldSuppressClick()) {
        return;
      }
      handleReturn(playerId);
    },
    [drag, handleReturn],
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

  const hoverCourtId =
    drag.hoverTarget?.kind === "court" ? drag.hoverTarget.courtId : null;
  const hoverWaiting = drag.hoverTarget?.kind === "waiting";

  return (
    <div className={`pegboard-shell${drag.isDragging ? " is-dragging" : ""}`}>
      <header className="app-header">
        <div className="header-brand-block">
          <div className="brand">
            <TennisBall className="brand-ball" />
            <div>
              <p className="scoreboard-label">Club pegboard</p>
              <h1>Tennis Court Board</h1>
            </div>
          </div>
          <TextSizeControl textSize={textSize} onChange={setTextSize} />
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
        <div className="board-grid">
          <div className={waitingPulse ? "waiting-bounce" : undefined}>
            <WaitingList
              players={pegboard.waitingPlayers}
              selectedPlayerId={pegboard.selectedPlayerId}
              disabled={!pegboard.canInteract}
              dropActive={hoverWaiting}
              draggingPlayerId={drag.session?.playerId ?? null}
              onSelect={handleSelect}
              onRename={handleRename}
              onDelete={handleDelete}
              onDragStart={drag.beginPointerDrag}
            />
          </div>

          <div className="courts-column" aria-label="On Court">
            <div className="on-court-heading">
              <h2>On Court</h2>
              <p>Drag players onto a court · 2–4 preferred · 1 marked incomplete</p>
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
                    canReceive={
                      Boolean(pegboard.selectedPlayerId) && !court.isFull
                    }
                    dropActive={hoverCourtId === court.courtId}
                    draggingPlayerId={drag.session?.playerId ?? null}
                    onAssign={handleAssignSelected}
                    onReturn={handleReturnClick}
                    onDragStart={drag.beginPointerDrag}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <StatsTicker board={pegboard.board} />

      {drag.session ? <DragGhost session={drag.session} /> : null}
    </div>
  );
}
