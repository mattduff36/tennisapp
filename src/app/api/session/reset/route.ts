import { handleResetSession } from "@/features/session/api/session-handlers";
import { jsonError, jsonResult } from "@/features/session/api/json-route";
import { getSessionRepository } from "@/features/session/storage/get-session-repository";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    return jsonResult(await handleResetSession(getSessionRepository()));
  } catch (error) {
    const notice = error instanceof Error ? error.message : "Could not reset.";
    return jsonError(notice);
  }
}
