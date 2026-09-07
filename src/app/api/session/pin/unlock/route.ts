import { jsonError, jsonResultWithUnlockCookie } from "@/features/session/api/json-route";
import { handleUnlockPin } from "@/features/session/pin/pin-handlers";
import { getPinStore } from "@/features/session/pin/get-pin-store";
import { getSessionRepository } from "@/features/session/storage/get-session-repository";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await handleUnlockPin(
      getSessionRepository(),
      getPinStore(),
      payload,
    );
    return jsonResultWithUnlockCookie(result, result.unlockCookie);
  } catch (error) {
    const notice = error instanceof Error ? error.message : "Could not unlock settings.";
    return jsonError(notice);
  }
}
