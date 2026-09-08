import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../../docs/assets/screenshots");
fs.mkdirSync(outDir, { recursive: true });

const base = process.env.HOSPITAL_BASE_URL ?? "http://127.0.0.1:3025";

async function shot(page, name) {
  const file = path.join(outDir, name);
  await page.screenshot({ path: file, fullPage: true });
  console.log("wrote", name, fs.statSync(file).size);
}

const browser = await chromium.launch();

async function captureRole(username, password, file) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();
  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  await page.locator("#username").fill(username);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((url) => !url.pathname.endsWith("/login"), {
    timeout: 15000,
  });
  await page.waitForTimeout(1000);
  await shot(page, file);
  await context.close();
}

{
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();
  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  await shot(page, "15-web-login-2.0.0.png");
  await context.close();
}

await captureRole("manager", "m", "16-web-manager-2.0.0.png");
await captureRole("secretary", "s", "17-web-secretary-2.0.0.png");
await captureRole("doctor", "d", "18-web-doctor-2.0.0.png");
await captureRole("patient", "p", "19-web-patient-2.0.0.png");

await browser.close();
console.log("DONE web 2.0.0");
