import { expect, test } from "@playwright/test";
import path from "node:path";
import { createMemorySessionRepository } from "../src/features/session/storage/memory-session-repository";
import { mockSessionApi } from "./mock-session-api";

test("VISUAL-01: portrait and landscape grass-court board remain usable", async ({
  page,
}, testInfo) => {
  const repository = createMemorySessionRepository();
  await mockSessionApi(page, repository);

  await page.goto("/");
  await expect(page.getByLabel("Add player")).toBeEnabled();

  await page.getByLabel("Add player").fill("Ada");
  await page.getByRole("button", { name: "Add" }).click();
  await page.getByLabel("Add player").fill("Bea");
  await page.getByRole("button", { name: "Add" }).click();

  await page.setViewportSize({ width: 820, height: 1180 });
  const portraitPath = path.join(testInfo.outputDir, "portrait.png");
  await page.screenshot({ path: portraitPath, fullPage: true });
  await expect(page.getByRole("heading", { name: "Waiting" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Court 1" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add" })).toBeInViewport();

  await page.setViewportSize({ width: 1280, height: 800 });
  const landscapePath = path.join(testInfo.outputDir, "landscape.png");
  await page.screenshot({ path: landscapePath, fullPage: true });
  await expect(page.getByRole("heading", { name: "On Court" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Court 3" })).toBeInViewport();
});
