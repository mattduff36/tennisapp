import { expect, test } from "@playwright/test";
import { createMemorySessionRepository } from "../src/features/session/storage/memory-session-repository";
import { mockSessionApi } from "./mock-session-api";

test("DASH-E2E-01 tablet add waiters → Players ready → court names/duration → clear court", async ({
  page,
}) => {
  const repository = createMemorySessionRepository();
  await mockSessionApi(page, repository);

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");

  for (const name of ["Ada", "Bea", "Cara", "Dee"]) {
    await page.getByLabel("Add player").fill(name);
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText(name, { exact: true })).toBeVisible();
  }

  await page.getByRole("button", { name: "Players ready" }).click();
  await page.getByRole("button", { name: "Yes, players ready" }).click();

  await expect(page.getByRole("heading", { name: "Court 1" })).toBeVisible();
  const courtOne = page.locator(".court-zone").first();
  await expect(courtOne.getByText("Ada")).toBeVisible();
  await expect(courtOne.getByText("Bea")).toBeVisible();
  await expect(courtOne.locator(".zone-count")).not.toHaveText("Free");

  await page.getByRole("button", { name: "Clear court" }).click();
  await expect(page.getByText("Court 1 is free again.")).toBeVisible();
  await expect(page.locator(".waiting-zone").getByText("Ada", { exact: true })).toBeVisible();
});

test("DASH-E2E-02 dashboard Settings nav opens settings; Board nav returns", async ({
  page,
}) => {
  const repository = createMemorySessionRepository();
  await mockSessionApi(page, repository);

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Club app" });
  await expect(nav.getByRole("link", { name: "Board" })).toBeVisible();
  await nav.getByRole("link", { name: "Settings" }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await page.getByRole("navigation", { name: "Club app" }).getByRole("link", { name: "Board" }).click();
  await expect(page.getByRole("heading", { name: "Tennis Court Board" })).toBeVisible();
});

test("DASH-E2E-04 wide board keeps add/ready capped and a full court visible", async ({
  page,
}) => {
  const repository = createMemorySessionRepository();
  await mockSessionApi(page, repository);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  for (const name of ["Ian", "Kay", "Roger", "Sarah", "Fred", "Ann", "Stu"]) {
    await page.getByLabel("Add player").fill(name);
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText(name, { exact: true })).toBeVisible();
  }

  await page.getByRole("button", { name: "Players ready" }).click();
  await page.getByRole("button", { name: "Yes, players ready" }).click();

  const addInput = page.getByLabel("Add player");
  const addBox = await addInput.boundingBox();
  expect(addBox).toBeTruthy();
  expect(addBox!.width).toBeLessThan(400);

  const ready = page.getByRole("button", { name: "Need 1 more" });
  await expect(ready).toBeVisible();
  const readyBox = await ready.boundingBox();
  expect(readyBox).toBeTruthy();
  expect(readyBox!.width).toBeLessThan(480);

  const courtOne = page.locator(".court-zone").first();
  const overflow = await courtOne.evaluate(
    (el) => el.scrollHeight - el.clientHeight,
  );
  expect(overflow).toBeLessThanOrEqual(2);

  for (const name of ["Ian", "Kay", "Roger", "Sarah"]) {
    await expect(courtOne.getByText(name, { exact: true })).toBeInViewport();
  }

  const waiting = page.locator(".waiting-zone");
  const waitingBox = await waiting.boundingBox();
  expect(waitingBox).toBeTruthy();
  expect(waitingBox!.width).toBeLessThan(360);

  const sarahBox = await courtOne.getByText("Sarah", { exact: true }).boundingBox();
  const clearBox = await courtOne
    .getByRole("button", { name: "Clear court" })
    .boundingBox();
  expect(sarahBox).toBeTruthy();
  expect(clearBox).toBeTruthy();
  expect(clearBox!.y).toBeGreaterThan(sarahBox!.y + sarahBox!.height - 1);
});

test("DASH-E2E-03 board shows 1 and 8 court layouts", async ({ page }) => {
  const repository = createMemorySessionRepository();
  await mockSessionApi(page, repository);

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

  await page.getByRole("button", { name: "−" }).click();
  await page.getByRole("button", { name: "−" }).click();
  await expect(page.getByText("1", { exact: true })).toBeVisible();
  await page.getByRole("navigation", { name: "Club app" }).getByRole("link", { name: "Board" }).click();
  await expect(page.getByRole("heading", { name: "Court 1" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Court 2" })).toHaveCount(0);
  await expect(page.locator(".courts-grid")).toHaveAttribute("data-court-count", "1");
  await expect(page.locator(".courts-grid")).toHaveAttribute(
    "data-court-density",
    "comfortable",
  );

  await page.getByRole("link", { name: "Settings" }).click();
  for (let step = 0; step < 7; step += 1) {
    await page.getByRole("button", { name: "+" }).click();
  }
  await expect(page.locator(".play-count-value")).toHaveText("8");
  await page.getByRole("navigation", { name: "Club app" }).getByRole("link", { name: "Board" }).click();
  await expect(page.getByRole("heading", { name: "Court 8" })).toBeVisible();
  await expect(page.locator(".courts-grid")).toHaveAttribute("data-court-count", "8");
  await expect(page.locator(".courts-grid")).toHaveAttribute("data-court-density", "compact");
});
