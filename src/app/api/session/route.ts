import { handleGetSession } from "@/features/session/api/session-handlers";
import { jsonError, jsonResult } from "@/features/session/api/json-route";
import { getPinStore } from "@/features/session/pin/get-pin-store";
import { loadPinAccess } from "@/features/session/pin/pin-handlers";
import { PIN_COOKIE_NAME, readCookieValue } from "@/features/session/pin/settings-pin";
import { getSessionRepository } from "@/features/session/storage/get-session-repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const token = new URL(request.url).searchParams.get("token");
    const pin = await loadPinAccess(
      getPinStore(),
      readCookieValue(request.headers.get("cookie"), PIN_COOKIE_NAME),
    );
    const result = await handleGetSession(getSessionRepository(), token, pin);
    return jsonResult(result);
  } catch (error) {
    const notice = error instanceof Error ? error.message : "Could not load the session.";
    return jsonError(notice);
  }
}
