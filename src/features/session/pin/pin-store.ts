import type { PinRecord } from "./settings-pin";

export interface PinStore {
  load(): Promise<PinRecord>;
  save(record: PinRecord): Promise<void>;
}

export function createMemoryPinStore(initial?: PinRecord): PinStore {
  let record: PinRecord = initial
    ? { ...initial }
    : { hash: null, salt: null, unlockToken: null };

  return {
    async load() {
      return { ...record };
    },
    async save(next) {
      record = { ...next };
    },
  };
}
