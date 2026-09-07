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

test("DASH-E2E-02 dashboard Settings chip opens settings; Board nav returns", async ({
  page,
}) => {
  const repository = createMemorySessionRepository();
  await mockSessionApi(page, repository);

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.getByRole("link", { name: "Settings" }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await page.getByRole("navigation", { name: "Club app" }).getByRole("link", { name: "Board" }).click();
  await expect(page.getByRole("heading", { name: "Tennis Court Board" })).toBeVisible();
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

  await page.getByRole("link", { name: "Settings" }).click();
  for (let step = 0; step < 7; step += 1) {
    await page.getByRole("button", { name: "+" }).click();
  }
  await expect(page.locator(".play-count-value")).toHaveText("8");
  await page.getByRole("navigation", { name: "Club app" }).getByRole("link", { name: "Board" }).click();
  await expect(page.getByRole("heading", { name: "Court 8" })).toBeVisible();
});
