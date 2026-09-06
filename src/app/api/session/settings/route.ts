import { handlePatchSettings } from "@/features/session/api/session-handlers";
import { jsonError, jsonResult } from "@/features/session/api/json-route";
import { getSessionRepository } from "@/features/session/storage/get-session-repository";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const payload = await request.json();
    return jsonResult(await handlePatchSettings(getSessionRepository(), payload));
  } catch (error) {
    const notice = error instanceof Error ? error.message : "Could not save settings.";
    return jsonError(notice);
  }
}
