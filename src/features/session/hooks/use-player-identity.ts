"use client";

import { useSyncExternalStore } from "react";
import {
  getPlayerIdentitySnapshot,
  parsePlayerIdentity,
  subscribePlayerIdentity,
  type PlayerIdentity,
} from "../identity/player-identity";

export function usePlayerIdentity(): PlayerIdentity | null {
  const raw = useSyncExternalStore(
    subscribePlayerIdentity,
    getPlayerIdentitySnapshot,
    () => null,
  );
  if (!raw) {
    return null;
  }
  try {
    return parsePlayerIdentity(JSON.parse(raw));
  } catch {
    return null;
  }
}
