import { createNeonSessionRepository } from "./neon-session-repository";
import type { SessionRepository } from "./session-repository";

let repository: SessionRepository | null = null;

export function getSessionRepository(): SessionRepository {
  if (!repository) {
    repository = createNeonSessionRepository();
  }
  return repository;
}
