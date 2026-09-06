import { handleDoneSession } from "@/features/session/api/session-handlers";
import { jsonError, jsonResult } from "@/features/session/api/json-route";
import { getSessionRepository } from "@/features/session/storage/get-session-repository";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    return jsonResult(await handleDoneSession(getSessionRepository(), payload));
  } catch (error) {
    const notice = error instanceof Error ? error.message : "Could not free the court.";
    return jsonError(notice);
  }
}
