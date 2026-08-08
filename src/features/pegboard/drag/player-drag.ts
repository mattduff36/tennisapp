import type { CourtId } from "../model/board";

export type DragOrigin = "waiting" | "court";

export type PlayerDragSession = {
  playerId: string;
  name: string;
  origin: DragOrigin;
  pointerId: number;
  x: number;
  y: number;
  active: boolean;
};

export type DropTarget =
  | { kind: "waiting" }
  | { kind: "court"; courtId: CourtId };

export const DROP_ATTR = "data-pegboard-drop";

export function readDropTarget(element: Element | null): DropTarget | null {
  const host = element?.closest(`[${DROP_ATTR}]`);
  if (!(host instanceof HTMLElement)) {
    return null;
  }

  const value = host.getAttribute(DROP_ATTR);
  if (value === "waiting") {
    return { kind: "waiting" };
  }

  if (value === "1" || value === "2" || value === "3") {
    return { kind: "court", courtId: Number(value) as CourtId };
  }

  return null;
}

export function dropTargetUnderPoint(x: number, y: number): DropTarget | null {
  const node = document.elementFromPoint(x, y);
  return readDropTarget(node);
}
