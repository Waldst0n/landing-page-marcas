// Usa puppeteer-core (não baixa Chrome). Ajuste CHROME_PATH se necessário.
import { launch } from "puppeteer-core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const BASE_URL = (process.env.BASE_URL || "http://localhost:3009").trim();
const RAW_PARAM = (process.argv[2] || process.env.TEST_PARAM || "").trim();

const base = BASE_URL.replace(/\/$/, "");

let suffix = "/";
if (RAW_PARAM) {
  if (RAW_PARAM.startsWith("/?") || RAW_PARAM.startsWith("?")) {
    suffix = RAW_PARAM.startsWith("?") ? `/${RAW_PARAM}` : RAW_PARAM;
  } else {
    suffix = `/?EMS=${encodeURIComponent(RAW_PARAM)}`;
  }
}

const finalUrl = `${base}${suffix}`;
console.log("Abrindo:", finalUrl);

function guessChromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const candidates =
    process.platform === "win32"
      ? [
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        path.join(
          process.env.LOCALAPPDATA || "",
          "Google\\Chrome\\Application\\chrome.exe"
        ),
      ]
      : process.platform === "darwin"
        ? ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]
        : [
          "/usr/bin/google-chrome",
          "/usr/bin/google-chrome-stable",
          "/snap/bin/chromium",
        ];
  for (const p of candidates) {
    try {
      if (p && fs.existsSync(p)) return p;
    } catch { }
  }
  return undefined;
}

const executablePath = guessChromePath();

const browser = await launch({
  headless: "new",
  executablePath,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
});
const page = await browser.newPage();

page.on("console", (msg) => {
  const type = msg.type();
  const text = msg.text();
  if (!["debug"].includes(type)) {
    console.log(`🟦 [console.${type}] ${text}`);
  }
});
page.on("pageerror", (err) => console.error("🟥 [pageerror]", err));
page.on("requestfailed", (req) =>
  console.error("🟧 [requestfailed]", req.url(), req.failure()?.errorText || "")
);

await page.goto(finalUrl, { waitUntil: "domcontentloaded", timeout: 120000 });

try {
  await page.waitForResponse(
    (res) => /\/api\/v1\/marcas\?EMS=/.test(res.url()) && res.status() === 200,
    { timeout: 60000 }
  );
  console.log("✅ API /marcas respondida com 200");
} catch {
  console.warn("⚠️ API de marcas não confirmou 200 no tempo esperado.");
}

try {
  await page.waitForSelector("a[href^='/loja/']", {
    visible: true,
    timeout: 15000,
  });
  console.log("✅ Loja visível encontrada");
} catch (err) {
  console.warn("⚠️ Nenhuma loja visível encontrada. Salvando error-preview...");
  await page.screenshot({
    path: path.join(__dirname, "../dist/error-preview.png"),
    fullPage: true,
  });
  throw err;
}

await sleep(2000);

const outDir = path.join(__dirname, "../dist");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "preview.png");

await page.screenshot({
  path: outPath,
  fullPage: false,
  captureBeyondViewport: false,
});
console.log("📸 Screenshot salvo em:", outPath);

await browser.close();
console.log("🏁 Finalizado.");
