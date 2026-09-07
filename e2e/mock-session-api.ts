import type { Page } from "@playwright/test";
import {
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

export async function mockSessionApi(page: Page, repository: SessionRepository) {
  await page.route("**/api/session**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();
    const payload = request.postDataJSON();

    if (method === "GET" && path === "/api/session") {
      await fulfill(route, await handleGetSession(repository, url.searchParams.get("token")));
      return;
    }
    if (method === "POST" && path === "/api/session/join") {
      await fulfill(route, await handleJoinSession(repository, payload));
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
      await fulfill(route, await handleResetSession(repository));
      return;
    }
    if (method === "PATCH" && path === "/api/session/settings") {
      await fulfill(route, await handlePatchSettings(repository, payload));
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
