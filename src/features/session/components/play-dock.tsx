"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

const PlayDockTargetContext = createContext<HTMLElement | null>(null);

export function PlayDockProvider({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [target, setTarget] = useState<HTMLDivElement | null>(null);

  return (
    <PlayDockTargetContext.Provider value={target}>
      {children}
      <div ref={setTarget} className="play-dock">
        {fallback}
      </div>
    </PlayDockTargetContext.Provider>
  );
}

export function PlayDockFill({ children }: { children: ReactNode }) {
  const target = useContext(PlayDockTargetContext);
  if (!target) {
    return null;
  }
  return createPortal(children, target);
}

export function PlayDock({ children }: { children: ReactNode }) {
  return <div className="play-dock">{children}</div>;
}
