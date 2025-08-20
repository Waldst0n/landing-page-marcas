// Usa puppeteer-core (não baixa Chrome). Ajuste CHROME_PATH se necessário.
import { launch } from "puppeteer-core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Lê BASE_URL e TEST_PARAM do ambiente/argv
const BASE_URL = (process.env.BASE_URL || "http://localhost:3009").trim();
const RAW_PARAM = (process.argv[2] || process.env.TEST_PARAM || "").trim();

// Normaliza BASE_URL (sem barra final)
const base = BASE_URL.replace(/\/$/, "");

// Monta o sufixo de query SEM re-encode do TEST_PARAM quando já vier pronto (/?UMS=... ou ?UMS=...)
let suffix = "/"; // default: raiz
if (RAW_PARAM) {
  if (RAW_PARAM.startsWith("/?")) {
    suffix = RAW_PARAM; // mantém exatamente como veio
  } else if (RAW_PARAM.startsWith("?")) {
    suffix = `/${RAW_PARAM}`; // garante a barra antes da query
  } else {
    // veio só o valor do UMS; monta do zero encodando apenas o valor
    suffix = `/?UMS=${encodeURIComponent(RAW_PARAM)}`;
  }
}

const finalUrl = `${base}${suffix}`;
console.log("Abrindo:", finalUrl);

// Descobre o Chrome local (ajuste CHROME_PATH se necessário)
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
    } catch {}
  }
  return undefined;
}

const executablePath = guessChromePath();

const browser = await launch({
  headless: "new",
  executablePath,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 }, // <- tamanho da "tela"
});
const page = await browser.newPage();

// Logs da página para facilitar debug
page.on("console", (msg) => {
  const type = msg.type();
  const text = msg.text();
  // filtra um pouco o ruído
  if (!["debug"].includes(type)) {
    console.log(`🟦 [console.${type}] ${text}`);
  }
});
page.on("pageerror", (err) => console.error("🟥 [pageerror]", err));
page.on("requestfailed", (req) =>
  console.error("🟧 [requestfailed]", req.url(), req.failure()?.errorText || "")
);

// Vá para a página e espere DOM básico
await page.goto(finalUrl, { waitUntil: "domcontentloaded", timeout: 120000 });

// ⚠️ Espera explícita pela chamada do endpoint de marcas (status 200)
try {
  await page.waitForResponse(
    (res) =>
      /http:\/\/localhost:3333\/api\/v1\/marcas/.test(res.url()) &&
      res.status() === 200,
    { timeout: 60000 }
  );
  console.log("✅ API /marcas respondida com 200");
} catch (e) {
  console.warn(
    "⚠️ Não confirmei a resposta 200 de /api/v1/marcas dentro do timeout. Vou tentar seguir com a checagem de DOM."
  );
}

// Agora espere os botões renderizados (seu map de lojas)
await page.waitForSelector("section .space-y-4 button", {
  visible: true,
  timeout: 60000,
});

// Opcional: garante que tem pelo menos 1 item mesmo
await page.waitForFunction(
  () => document.querySelectorAll("section .space-y-4 button").length > 0,
  { timeout: 30000 }
);

// Pequena folga para fontes/anim.
await sleep(500);

// Garante saída em dist/preview.png
const outDir = path.join(__dirname, "../dist");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "preview.png");

// Se quiser screenshot de um container específico, troque para page.locator/elementHandle.screenshot
await page.screenshot({
  path: outPath,
  fullPage: false, // <- garante só o viewport
  captureBeyondViewport: false,
});
console.log("📸 Screenshot salvo em:", outPath);

await browser.close();
console.log("🏁 Finalizado.");
