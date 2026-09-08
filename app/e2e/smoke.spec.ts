import { expect, test } from "@playwright/test";

async function signIn(
  page: import("@playwright/test").Page,
  username: string,
  password: string,
) {
  await page.goto("/login");
  await page.locator("#username").fill(username);
  await page.locator("#password").fill(password);
  await page.locator("form").getByRole("button", { name: /Sign in/i }).click();
}

test("doctor sees today's calendar", async ({ page }) => {
  await signIn(page, "doctor", "d");
  await expect(page).toHaveURL("/doctor");
  await expect(
    page.getByRole("heading", { name: /Doctor desk/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Today's calendar/i }),
  ).toBeVisible();
});

test("patient sees book appointment form", async ({ page }) => {
  await signIn(page, "patient", "p");
  await expect(page).toHaveURL("/patient");
  await expect(
    page.getByRole("heading", { name: /Patient desk/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Book appointment/i }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Book appointment/i })).toBeVisible();
});
