import { createNeonPinStore } from "./neon-pin-store";
import type { PinStore } from "./pin-store";

let store: PinStore | null = null;

export function getPinStore(): PinStore {
  if (!store) {
    store = createNeonPinStore();
  }
  return store;
}
