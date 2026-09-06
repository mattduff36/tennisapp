import type { SessionState } from "../model/session";

export type SessionApplyResult<T> = {
  next: SessionState;
  changed: boolean;
  value: T;
};

export interface SessionRepository {
  load(): Promise<SessionState>;
  transact<T>(
    apply: (state: SessionState) => SessionApplyResult<T>,
  ): Promise<T>;
}
