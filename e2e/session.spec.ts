import { expect, test, type Page } from "@playwright/test";
import {
  handleJoinSession,
  handleReadySession,
} from "../src/features/session/api/session-handlers";
import { createMemorySessionRepository } from "../src/features/session/storage/memory-session-repository";
import { mockSessionApi } from "./mock-session-api";

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

function playDock(page: Page) {
  return page.locator(".play-dock");
}

async function openJoinForm(page: Page) {
  await playDock(page).getByRole("button", { name: "Join this session" }).click();
}

test("PLAY-E2E-01 name → lobby → ready → assignment copy", async ({ page }) => {
  const repository = createMemorySessionRepository();
  await handleJoinSession(repository, { token: "seed-2", name: "Bea" });
  await handleJoinSession(repository, { token: "seed-3", name: "Cara" });
  await handleJoinSession(repository, { token: "seed-4", name: "Dee" });
  await mockSessionApi(page, repository);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/play");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  await openJoinForm(page);
  await expect(page.getByRole("heading", { name: "What is your name?" })).toBeVisible();
  await page.getByLabel("Your name").fill("Ada");
  await page.getByRole("button", { name: "Join the pool" }).click();

  await expect(page.getByRole("heading", { name: "In the pool" })).toBeVisible();
  await expect(page.getByText("Ada (you)")).toBeVisible();
  await page.getByRole("button", { name: "Players ready" }).click();
  await page.getByRole("button", { name: "Yes, players ready" }).click();

  await expect(page.getByRole("heading", { name: "Court 1" })).toBeVisible();
  await expect(page.getByText("Ada (you)")).toBeVisible();
  await expect(page.locator(".play-pool").getByText("Bea", { exact: true })).toBeVisible();
});

test("PLAY-E2E-05 helper-added name can be claimed", async ({ page }) => {
  const repository = createMemorySessionRepository();
  await handleJoinSession(repository, {
    token: "helper-ada",
    name: "Ada",
    claimed: false,
  });
  await mockSessionApi(page, repository);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/play");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  await openJoinForm(page);
  await page.getByLabel("Your name").fill("Ada");
  await page.getByRole("button", { name: "Join the pool" }).click();
  await expect(page.getByRole("heading", { name: "Is that you?" })).toBeVisible();
  await page.getByRole("button", { name: "Claim this name" }).click();
  await expect(page.getByRole("heading", { name: "In the pool" })).toBeVisible();
  await expect(page.getByText("Ada (you)")).toBeVisible();
});

test("PLAY-E2E-02 duplicate name blocked", async ({ page }) => {
  const repository = createMemorySessionRepository();
  await handleJoinSession(repository, { token: "seed-1", name: "Ada" });
  await mockSessionApi(page, repository);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/play");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  await openJoinForm(page);
  await page.getByLabel("Your name").fill("ada");
  await page.getByRole("button", { name: "Join the pool" }).click();

  await expect(
    page.getByText("That name is already in the pool. Pick a different name."),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "What is your name?" })).toBeVisible();
});

test("PLAY-E2E-03 stale remembered token returns to the setup wizard", async ({
  page,
}) => {
  const repository = createMemorySessionRepository();
  await mockSessionApi(page, repository);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "tennisapp.me.v1",
      JSON.stringify({ version: 2, token: "missing-token", name: "Ghost" }),
    );
  });
  await page.goto("/play");
  await expect(playDock(page).getByRole("button", { name: "Start session" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start session" })).toHaveCount(2);
  await expect(page.getByText(/no longer in the pool/i)).toBeVisible();
});

test("PLAY-E2E-04 settings can clear a court", async ({ page }) => {
  const repository = createMemorySessionRepository();
  await handleJoinSession(repository, { token: "t1", name: "Ada" });
  await handleJoinSession(repository, { token: "t2", name: "Bea" });
  await handleJoinSession(repository, { token: "t3", name: "Cara" });
  await handleJoinSession(repository, { token: "t4", name: "Dee" });
  await handleReadySession(repository, { token: "t1" });
  await mockSessionApi(page, repository);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await page.getByRole("button", { name: "Clear court" }).click();
  await expect(page.getByText("Court 1 is free again.")).toBeVisible();
});

test("PLAY-E2E-06 settings PIN locks shared controls", async ({ page }) => {
  const repository = createMemorySessionRepository();
  await mockSessionApi(page, repository);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await page.getByLabel("New PIN").fill("1234");
  await page.getByLabel("Confirm PIN").fill("1234");
  await page.getByRole("button", { name: "Turn PIN on" }).click();
  await expect(page.getByText("Club PIN is on.")).toBeVisible();

  await page.context().clearCookies({ name: "tennisapp.settings.unlock" });
  await page.reload();
  await expect(page.getByText("Unlock with the club PIN")).toBeVisible();
  await expect(page.getByRole("button", { name: "Unlock" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Singles" })).toHaveCount(0);

  await page.getByLabel("Club PIN").fill("1234");
  await page.getByRole("button", { name: "Unlock" }).click();
  await expect(page.getByText("Settings unlocked.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Singles" })).toBeVisible();
});

test("PLAY-UI-01 Play/Settings in top nav; Players ready/Leave in bottom dock", async ({
  page,
}) => {
  const repository = createMemorySessionRepository();
  await handleJoinSession(repository, { token: "seed-2", name: "Bea" });
  await mockSessionApi(page, repository);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/play");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await openJoinForm(page);
  await page.getByLabel("Your name").fill("Ada");
  await page.getByRole("button", { name: "Join the pool" }).click();

  const nav = page.getByRole("navigation", { name: "Club app" });
  await expect(nav.getByRole("link", { name: "Play" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Settings" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Board" })).toBeVisible();

  const dock = playDock(page);
  await expect(dock.getByRole("button", { name: "Need 2 more" })).toBeVisible();
  await expect(dock.getByRole("button", { name: "Leave" })).toBeVisible();
});

test("PLAY-UI-03 wizard and join CTAs sit in the dock; ball is a second start target", async ({
  page,
}) => {
  const repository = createMemorySessionRepository();
  await mockSessionApi(page, repository);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/play");

  const dock = playDock(page);
  await expect(dock.getByRole("button", { name: "Start session" })).toBeVisible();
  await expect(page.locator(".play-main").getByRole("button", { name: "Start session" })).toBeVisible();
  await expect(page.locator(".play-main").getByRole("button", { name: "Start session" })).toHaveClass(
    /play-ball-action/,
  );

  await page.locator(".play-main").getByRole("button", { name: "Start session" }).click();
  await expect(page.getByRole("heading", { name: "What is your name?" })).toBeVisible();
  await expect(dock.getByRole("button", { name: "Next", exact: true })).toBeVisible();
  await expect(page.locator(".play-main").getByRole("button", { name: "Next", exact: true })).toHaveCount(0);
});

test("PLAY-UI-04 dock rises and shrinks when the keyboard covers the viewport", async ({
  page,
}) => {
  const repository = createMemorySessionRepository();
  await mockSessionApi(page, repository);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    const listeners = new Set<(event: Event) => void>();
    let height = window.innerHeight;
    const visualViewport = {
      get width() {
        return window.innerWidth;
      },
      get height() {
        return height;
      },
      get offsetTop() {
        return 0;
      },
      get offsetLeft() {
        return 0;
      },
      get scale() {
        return 1;
      },
      addEventListener(_type: string, listener: (event: Event) => void) {
        listeners.add(listener);
      },
      removeEventListener(_type: string, listener: (event: Event) => void) {
        listeners.delete(listener);
      },
      dispatchEvent() {
        return true;
      },
    };
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: visualViewport,
    });
    Object.assign(window, {
      __playKeyboard(open: boolean, visualHeight?: number) {
        height = open
          ? (visualHeight ?? Math.round(window.innerHeight * 0.52))
          : window.innerHeight;
        listeners.forEach((listener) => listener(new Event("resize")));
      },
    });
  });

  await page.goto("/play");
  await page.locator(".play-main").getByRole("button", { name: "Start session" }).click();
  await page.getByLabel("Your name").click();

  const shell = page.locator(".play-shell");
  await expect(shell).toHaveAttribute("data-keyboard", "closed");

  await page.evaluate(() => {
    (
      window as unknown as { __playKeyboard: (open: boolean, height?: number) => void }
    ).__playKeyboard(true, 470);
  });

  await expect(shell).toHaveAttribute("data-keyboard", "open");
  await expect(shell).toHaveAttribute("data-dock-size", "compact");
  await expect(playDock(page).getByRole("button", { name: "Next", exact: true })).toBeVisible();

  const tight = await page.evaluate(() => {
    const shellEl = document.querySelector(".play-shell");
    const dockEl = document.querySelector(".play-dock");
    if (!(shellEl instanceof HTMLElement) || !(dockEl instanceof HTMLElement)) {
      throw new Error("missing play chrome");
    }
    const shellBox = shellEl.getBoundingClientRect();
    const dockBox = dockEl.getBoundingClientRect();
    return {
      shellHeight: Math.round(shellBox.height),
      dockBottom: dockBox.bottom,
      shellBottom: shellBox.bottom,
      buttonMin: getComputedStyle(shellEl).getPropertyValue("--play-dock-button-min").trim(),
    };
  });
  expect(tight.shellHeight).toBe(470);
  expect(tight.dockBottom).toBeLessThanOrEqual(tight.shellBottom + 1);
  expect(tight.buttonMin).toBe("64px");

  await page.evaluate(() => {
    (
      window as unknown as { __playKeyboard: (open: boolean, height?: number) => void }
    ).__playKeyboard(true, 580);
  });
  await expect(shell).toHaveAttribute("data-dock-size", "full");

  await page.evaluate(() => {
    (window as unknown as { __playKeyboard: (open: boolean) => void }).__playKeyboard(false);
  });
  await expect(shell).toHaveAttribute("data-keyboard", "closed");
  await expect(shell).toHaveAttribute("data-dock-size", "full");
});

test("PLAY-UI-02 in-app nav stays inside Board / Play / Settings", async ({
  page,
}) => {
  const repository = createMemorySessionRepository();
  await mockSessionApi(page, repository);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/play");
  const nav = page.getByRole("navigation", { name: "Club app" });
  await nav.getByRole("link", { name: "Board" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "Tennis Court Board" })).toBeVisible();
  await page.getByRole("navigation", { name: "Club app" }).getByRole("link", { name: "Settings" }).click();
  await expect(page).toHaveURL("/settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await page.getByRole("navigation", { name: "Club app" }).getByRole("link", { name: "Play" }).click();
  await expect(page).toHaveURL("/play");
  await expect(playDock(page).getByRole("button", { name: "Start session" })).toBeVisible();
});

test("PLAY-E2E-08 live pool offers join or start new", async ({ page }) => {
  const repository = createMemorySessionRepository();
  await handleJoinSession(repository, { token: "seed-1", name: "Ada" });
  await mockSessionApi(page, repository);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/play");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  await expect(playDock(page).getByRole("button", { name: "Join this session" })).toBeVisible();
  page.once("dialog", (dialog) => {
    void dialog.accept();
  });
  await playDock(page).getByRole("button", { name: "Start a new session" }).click();
  await expect(playDock(page).getByRole("button", { name: "Start session" })).toBeVisible();
});

test.describe("phone play", () => {
  test.use({
    userAgent: IPHONE_UA,
    viewport: { width: 390, height: 844 },
  });

  test("PLAY-E2E-07 phone home opens the setup wizard", async ({ page }) => {
    const repository = createMemorySessionRepository();
    await mockSessionApi(page, repository);

    await page.goto("/");
    await expect(page).toHaveURL("/play");
    const nav = page.getByRole("navigation", { name: "Club app" });
    await expect(nav.getByRole("link", { name: "Play" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Settings" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Board" })).toHaveCount(0);
    await expect(page.locator(".play-nav-board")).toBeHidden();

    await playDock(page).getByRole("button", { name: "Start session" }).click();
    await page.getByLabel("Your name").fill("Ada");
    await playDock(page).getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Singles or doubles?" })).toBeVisible();
    await page.getByRole("button", { name: "Singles" }).click();
    await playDock(page).getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByRole("heading", { name: "How many courts?" })).toBeVisible();
    await page.getByRole("button", { name: "+" }).click();
    await playDock(page).getByRole("button", { name: "Next", exact: true }).click();
    await playDock(page).getByRole("button", { name: "Let's play!" }).click();

    await expect(page.getByRole("heading", { name: "In the pool" })).toBeVisible();
    await expect(page.getByText("Ada (you)")).toBeVisible();
    await expect(page.getByText("1 waiting · 2 needed for singles")).toBeVisible();
  });
});
