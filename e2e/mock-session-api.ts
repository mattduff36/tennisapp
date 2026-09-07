import type { Page } from "@playwright/test";
import {
  handleClaimSession,
  handleDoneSession,
  handleGetSession,
  handleJoinSession,
  handleLeaveSession,
  handlePatchSettings,
  handleReadySession,
  handleRemovePlayer,
  handleRenamePlayer,
  handleResetSession,
} from "../src/features/session/api/session-handlers";
import { handleUnlockPin, handleUpdatePin } from "../src/features/session/pin/pin-handlers";
import { createMemoryPinStore } from "../src/features/session/pin/pin-store";
import { PIN_COOKIE_NAME, readCookieValue } from "../src/features/session/pin/settings-pin";
import type { SessionRepository } from "../src/features/session/storage/session-repository";

async function fulfill(
  route: { fulfill: (response: { status: number; contentType: string; body: string }) => Promise<void> },
  result: { status: number; body: unknown },
) {
  await route.fulfill({
    status: result.status,
    contentType: "application/json",
    body: JSON.stringify(result.body),
  });
}

async function rememberUnlockCookie(
  page: Page,
  unlockCookie: string | null | undefined,
) {
  if (unlockCookie === undefined) {
    return;
  }
  if (unlockCookie) {
    await page.context().addCookies([
      {
        name: PIN_COOKIE_NAME,
        value: unlockCookie,
        url: "http://localhost:3000",
      },
    ]);
    return;
  }
  await page.context().clearCookies({ name: PIN_COOKIE_NAME });
}

export async function mockSessionApi(page: Page, repository: SessionRepository) {
  const pinStore = createMemoryPinStore();

  await page.route("**/api/session**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();
    const payload = request.postDataJSON();
    const pinCookie = readCookieValue(
      request.headers()["cookie"] ?? null,
      PIN_COOKIE_NAME,
    );
    const record = await pinStore.load();
    const pin = {
      enabled: Boolean(record.hash),
      unlocked: record.hash ? pinCookie === record.unlockToken : true,
    };

    if (method === "GET" && path === "/api/session") {
      await fulfill(route, await handleGetSession(repository, url.searchParams.get("token"), pin));
      return;
    }
    if (method === "POST" && path === "/api/session/join") {
      await fulfill(route, await handleJoinSession(repository, payload));
      return;
    }
    if (method === "POST" && path === "/api/session/claim") {
      await fulfill(route, await handleClaimSession(repository, payload));
      return;
    }
    if (method === "POST" && path === "/api/session/ready") {
      await fulfill(route, await handleReadySession(repository, payload));
      return;
    }
    if (method === "POST" && path === "/api/session/done") {
      await fulfill(route, await handleDoneSession(repository, payload));
      return;
    }
    if (method === "POST" && path === "/api/session/leave") {
      await fulfill(route, await handleLeaveSession(repository, payload));
      return;
    }
    if (method === "POST" && path === "/api/session/reset") {
      await fulfill(route, await handleResetSession(repository, pin));
      return;
    }
    if (method === "PATCH" && path === "/api/session/settings") {
      await fulfill(route, await handlePatchSettings(repository, payload, pin));
      return;
    }
    if (method === "POST" && path === "/api/session/pin/unlock") {
      const result = await handleUnlockPin(repository, pinStore, payload);
      await rememberUnlockCookie(page, result.unlockCookie);
      await fulfill(route, result);
      return;
    }
    if (method === "POST" && path === "/api/session/pin") {
      const result = await handleUpdatePin(repository, pinStore, payload);
      await rememberUnlockCookie(page, result.unlockCookie);
      await fulfill(route, result);
      return;
    }
    if (method === "PATCH" && path === "/api/session/player") {
      await fulfill(route, await handleRenamePlayer(repository, payload));
      return;
    }
    if (method === "DELETE" && path === "/api/session/player") {
      await fulfill(route, await handleRemovePlayer(repository, payload));
      return;
    }

    await route.fallback();
  });
}
