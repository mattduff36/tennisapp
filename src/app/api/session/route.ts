import { handleGetSession } from "@/features/session/api/session-handlers";
import { jsonError, jsonResult } from "@/features/session/api/json-route";
import { getSessionRepository } from "@/features/session/storage/get-session-repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const token = new URL(request.url).searchParams.get("token");
    const result = await handleGetSession(getSessionRepository(), token);
    return jsonResult(result);
  } catch (error) {
    const notice = error instanceof Error ? error.message : "Could not load the session.";
    return jsonError(notice);
  }
}
