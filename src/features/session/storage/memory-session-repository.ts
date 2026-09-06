import { cloneSession, createDefaultSession, type SessionState } from "../model/session";
import type { SessionApplyResult, SessionRepository } from "./session-repository";

export function createMemorySessionRepository(
  initial: SessionState = createDefaultSession(),
): SessionRepository {
  let state = cloneSession(initial);

  return {
    async load() {
      return cloneSession(state);
    },
    async transact<T>(apply: (current: SessionState) => SessionApplyResult<T>) {
      const result = apply(cloneSession(state));
      if (result.changed) {
        state = cloneSession(result.next);
      }
      return result.value;
    },
  };
}
