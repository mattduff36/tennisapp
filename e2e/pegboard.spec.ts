import { expect, test, type Page } from "@playwright/test";

async function openFreshBoard(page: Page) {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await expect(page.getByRole("heading", { name: "Tennis Court Board" })).toBeVisible();
  await expect(page.getByLabel("Add player")).toBeEnabled();
  await expect(page.getByRole("button", { name: "Select Player 1 from Waiting" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Select Player 4 from Waiting" })).toBeVisible();
}

test("ASSIGN / RETURN / incomplete / capacity flows", async ({ page }) => {
  await openFreshBoard(page);

  await page.getByLabel("Add player").fill("Ada");
  await page.getByRole("button", { name: "Add" }).click();
  await page.getByLabel("Add player").fill("Bea");
  await page.getByRole("button", { name: "Add" }).click();

  await page.getByRole("button", { name: "Select Ada from Waiting" }).click();
  await page.getByRole("button", { name: "Place selected player on Court 1" }).click();

  await expect(page.getByText("Incomplete — needs another player")).toBeVisible();
  await expect(page.getByRole("button", { name: "Return Ada to Waiting" })).toBeVisible();

  await page.getByRole("button", { name: "Select Bea from Waiting" }).click();
  await page.getByRole("button", { name: "Place selected player on Court 1" }).click();
  await expect(page.getByText("Incomplete — needs another player")).toHaveCount(0);

  for (const name of ["Cara", "Dee"]) {
    await page.getByLabel("Add player").fill(name);
    await page.getByRole("button", { name: "Add" }).click();
    await page.getByRole("button", { name: `Select ${name} from Waiting` }).click();
    await page.getByRole("button", { name: "Place selected player on Court 1" }).click();
  }

  await page.getByLabel("Add player").fill("Eve");
  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("button", { name: "Select Eve from Waiting" }).click();
  await page.getByRole("button", { name: "Court 1 is full" }).click();
  await expect(page.getByText(/Court 1 is full \(4 players\)/i)).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Eve, selected. Tap a court to place, or tap again to clear.",
    }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Return Ada to Waiting" }).click();
  await expect(page.getByRole("button", { name: "Select Ada from Waiting" })).toBeVisible();
});

test("A11Y-01 / MOTION-01: labelled controls, return bounce, and reduced motion", async ({
  page,
}) => {
  await openFreshBoard(page);

  const add = page.getByRole("button", { name: "Add" });
  const box = await add.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.height).toBeGreaterThanOrEqual(48);

  await page.getByLabel("Add player").fill("Focus Player");
  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("button", { name: "Select Focus Player from Waiting" }).click();
  await page.getByRole("button", { name: "Place selected player on Court 1" }).click();
  await expect(page.locator(".court-bounce")).toHaveCount(1);

  await page.getByRole("button", { name: "Return Focus Player to Waiting" }).click();
  await expect(page.locator(".waiting-bounce")).toHaveCount(1);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Select Focus Player from Waiting" }).click();
  await page.getByRole("button", { name: "Place selected player on Court 1" }).click();
  await expect(page.locator(".court-bounce")).toHaveCount(0);
  await page.getByRole("button", { name: "Return Focus Player to Waiting" }).click();
  await expect(page.locator(".waiting-bounce")).toHaveCount(0);
});

test("PERSIST refresh keeps board state", async ({ page }) => {
  await openFreshBoard(page);

  await page.getByLabel("Add player").fill("Persisted");
  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("button", { name: "Select Persisted from Waiting" }).click();
  await page.getByRole("button", { name: "Place selected player on Court 2" }).click();

  await expect(page.getByText("Saved on this device")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("button", { name: "Return Persisted to Waiting" })).toBeVisible();
});
