"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { CourtId } from "../model/board";
import {
  dropTargetUnderPoint,
  type DragOrigin,
  type DropTarget,
  type PlayerDragSession,
} from "./player-drag";

const DRAG_THRESHOLD_PX = 8;

type UsePlayerDragOptions = {
  disabled: boolean;
  onDropToCourt: (playerId: string, courtId: CourtId) => boolean;
  onDropToWaiting: (playerId: string) => void;
};

export function usePlayerDrag({
  disabled,
  onDropToCourt,
  onDropToWaiting,
}: UsePlayerDragOptions) {
  const [session, setSession] = useState<PlayerDragSession | null>(null);
  const [hoverTarget, setHoverTarget] = useState<DropTarget | null>(null);
  const pendingRef = useRef<{
    playerId: string;
    name: string;
    origin: DragOrigin;
    pointerId: number;
    startX: number;
    startY: number;
  } | null>(null);
  const suppressNextClickRef = useRef(false);

  const endDrag = useCallback(() => {
    pendingRef.current = null;
    setSession(null);
    setHoverTarget(null);
  }, []);

  const shouldSuppressClick = useCallback(() => {
    if (!suppressNextClickRef.current) {
      return false;
    }
    suppressNextClickRef.current = false;
    return true;
  }, []);

  const beginPointerDrag = useCallback(
    (
      event: ReactPointerEvent,
      player: { id: string; name: string; origin: DragOrigin },
    ) => {
      if (disabled || event.button !== 0) {
        return;
      }

      pendingRef.current = {
        playerId: player.id,
        name: player.name,
        origin: player.origin,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
      };

      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Capture can fail on some hosts; window listeners still work.
      }
    },
    [disabled],
  );

  useEffect(() => {
    function onPointerMove(event: PointerEvent) {
      const pending = pendingRef.current;
      if (!pending || event.pointerId !== pending.pointerId) {
        return;
      }

      const dx = event.clientX - pending.startX;
      const dy = event.clientY - pending.startY;
      const distance = Math.hypot(dx, dy);

      setSession((current) => {
        if (!current) {
          if (distance < DRAG_THRESHOLD_PX) {
            return null;
          }
          return {
            playerId: pending.playerId,
            name: pending.name,
            origin: pending.origin,
            pointerId: pending.pointerId,
            x: event.clientX,
            y: event.clientY,
            active: true,
          };
        }

        if (event.pointerId !== current.pointerId) {
          return current;
        }

        return {
          ...current,
          x: event.clientX,
          y: event.clientY,
          active: true,
        };
      });

      if (distance >= DRAG_THRESHOLD_PX) {
        setHoverTarget(dropTargetUnderPoint(event.clientX, event.clientY));
      }
    }

    function onPointerUp(event: PointerEvent) {
      const pending = pendingRef.current;
      if (!pending || event.pointerId !== pending.pointerId) {
        return;
      }

      const wasDragging =
        Math.hypot(event.clientX - pending.startX, event.clientY - pending.startY) >=
        DRAG_THRESHOLD_PX;

      if (wasDragging) {
        suppressNextClickRef.current = true;
        const target = dropTargetUnderPoint(event.clientX, event.clientY);
        if (target?.kind === "court") {
          onDropToCourt(pending.playerId, target.courtId);
        } else if (target?.kind === "waiting" && pending.origin === "court") {
          onDropToWaiting(pending.playerId);
        }
        event.preventDefault();
      }

      endDrag();
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", endDrag);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", endDrag);
    };
  }, [endDrag, onDropToCourt, onDropToWaiting]);

  return {
    session,
    hoverTarget,
    beginPointerDrag,
    shouldSuppressClick,
    isDragging: Boolean(session?.active),
  };
}
