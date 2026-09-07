import { expect, test } from "@playwright/test";
import {
  handleJoinSession,
  handleReadySession,
} from "../src/features/session/api/session-handlers";
import { createMemorySessionRepository } from "../src/features/session/storage/memory-session-repository";
import { mockSessionApi } from "./mock-session-api";

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

  await page.getByLabel("Your name").fill("ada");
  await page.getByRole("button", { name: "Join the pool" }).click();

  await expect(
    page.getByText("That name is already in the pool. Pick a different name."),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "What is your name?" })).toBeVisible();
});

test("PLAY-E2E-03 stale remembered token returns to the name screen", async ({
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
  await expect(page.getByRole("heading", { name: "What is your name?" })).toBeVisible();
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
  await page.getByLabel("Your name").fill("Ada");
  await page.getByRole("button", { name: "Join the pool" }).click();

  const nav = page.getByRole("navigation", { name: "Club app" });
  await expect(nav.getByRole("link", { name: "Play" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Settings" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Board" })).toBeVisible();

  const dock = page.locator(".play-dock");
  await expect(dock.getByRole("button", { name: "Need 2 more" })).toBeVisible();
  await expect(dock.getByRole("button", { name: "Leave" })).toBeVisible();
});
