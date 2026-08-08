import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CourtCard } from "./court-card";

describe("CourtCard", () => {
  it("LAYOUT-MOBILE-04: uses compact court status and place labels", () => {
    render(
      <CourtCard
        courtId={1}
        players={[{ id: "p1", name: "Ada", location: { kind: "court", courtId: 1 }, locationEnteredAt: "2026-08-08T12:00:00.000Z" }]}
        isIncomplete
        isFull={false}
        disabled={false}
        canReceive
        dropActive={false}
        draggingPlayerId={null}
        onAssign={vi.fn()}
        onReturn={vi.fn()}
        onDragStart={vi.fn()}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Needs player");
    expect(
      screen.getByRole("button", { name: "Place selected player on Court 1" }),
    ).toHaveTextContent("Place here");
    expect(screen.queryByText(/Incomplete — needs another player/i)).toBeNull();
    expect(screen.queryByText(/Drop \/ Place here/i)).toBeNull();
  });
});
