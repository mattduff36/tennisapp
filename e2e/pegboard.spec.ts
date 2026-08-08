import { expect, test, type Page } from "@playwright/test";

async function openFreshBoard(page: Page) {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await expect(page.getByRole("heading", { name: "Tennis Court Board" })).toBeVisible();
  await expect(page.getByLabel("Add player")).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Drag Player 1 onto a court, or tap to select" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Drag Player 4 onto a court, or tap to select" }),
  ).toBeVisible();
}

test("ASSIGN / RETURN / incomplete / capacity flows", async ({ page }) => {
  await openFreshBoard(page);

  await page.getByLabel("Add player").fill("Ada");
  await page.getByRole("button", { name: "Add" }).click();
  await page.getByLabel("Add player").fill("Bea");
  await page.getByRole("button", { name: "Add" }).click();

  await page
    .getByRole("button", { name: "Drag Ada onto a court, or tap to select" })
    .click();
  await page.getByRole("button", { name: "Place selected player on Court 1" }).click();

  await expect(page.getByText("Incomplete — needs another player")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Drag Ada back to Waiting, or tap to return" }),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "Drag Bea onto a court, or tap to select" })
    .click();
  await page.getByRole("button", { name: "Place selected player on Court 1" }).click();
  await expect(page.getByText("Incomplete — needs another player")).toHaveCount(0);

  for (const name of ["Cara", "Dee"]) {
    await page.getByLabel("Add player").fill(name);
    await page.getByRole("button", { name: "Add" }).click();
    await page
      .getByRole("button", { name: `Drag ${name} onto a court, or tap to select` })
      .click();
    await page.getByRole("button", { name: "Place selected player on Court 1" }).click();
  }

  await page.getByLabel("Add player").fill("Eve");
  await page.getByRole("button", { name: "Add" }).click();
  await page
    .getByRole("button", { name: "Drag Eve onto a court, or tap to select" })
    .click();
  await page.getByRole("button", { name: "Court 1 is full" }).click();
  await expect(page.getByText(/Court 1 is full \(4 players\)/i)).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Eve, selected. Drag onto a court, or tap a court to place.",
    }),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "Drag Ada back to Waiting, or tap to return" })
    .click();
  await expect(
    page.getByRole("button", { name: "Drag Ada onto a court, or tap to select" }),
  ).toBeVisible();
});

test("drag waiting player onto a court without selecting first", async ({ page }) => {
  await openFreshBoard(page);

  const player = page.getByRole("button", {
    name: "Drag Player 1 onto a court, or tap to select",
  });
  const court = page.locator('[data-pegboard-drop="2"]');

  await player.dragTo(court);
  await expect(
    page.getByRole("button", { name: "Drag Player 1 back to Waiting, or tap to return" }),
  ).toBeVisible();
  await expect(page.getByText(/Player 1 moved to Court 2/i)).toBeVisible();
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
  await page
    .getByRole("button", { name: "Drag Focus Player onto a court, or tap to select" })
    .click();
  await page.getByRole("button", { name: "Place selected player on Court 1" }).click();
  await expect(page.locator(".court-bounce")).toHaveCount(1);

  await page
    .getByRole("button", { name: "Drag Focus Player back to Waiting, or tap to return" })
    .click();
  await expect(page.locator(".waiting-bounce")).toHaveCount(1);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page
    .getByRole("button", { name: "Drag Focus Player onto a court, or tap to select" })
    .click();
  await page.getByRole("button", { name: "Place selected player on Court 1" }).click();
  await expect(page.locator(".court-bounce")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Drag Focus Player back to Waiting, or tap to return" })
    .click();
  await expect(page.locator(".waiting-bounce")).toHaveCount(0);
});

test("PERSIST refresh keeps board state", async ({ page }) => {
  await openFreshBoard(page);

  await page.getByLabel("Add player").fill("Persisted");
  await page.getByRole("button", { name: "Add" }).click();
  await page
    .getByRole("button", { name: "Drag Persisted onto a court, or tap to select" })
    .click();
  await page.getByRole("button", { name: "Place selected player on Court 2" }).click();

  await expect(page.getByText("Saved on this device")).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole("button", { name: "Drag Persisted back to Waiting, or tap to return" }),
  ).toBeVisible();
});
