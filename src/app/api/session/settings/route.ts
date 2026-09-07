import { handlePatchSettings } from "@/features/session/api/session-handlers";
import { jsonError, jsonResult } from "@/features/session/api/json-route";
import { getPinStore } from "@/features/session/pin/get-pin-store";
import { loadPinAccess } from "@/features/session/pin/pin-handlers";
import { PIN_COOKIE_NAME, readCookieValue } from "@/features/session/pin/settings-pin";
import { getSessionRepository } from "@/features/session/storage/get-session-repository";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const payload = await request.json();
    const pin = await loadPinAccess(
      getPinStore(),
      readCookieValue(request.headers.get("cookie"), PIN_COOKIE_NAME),
    );
    return jsonResult(await handlePatchSettings(getSessionRepository(), payload, pin));
  } catch (error) {
    const notice = error instanceof Error ? error.message : "Could not save settings.";
    return jsonError(notice);
  }
}
