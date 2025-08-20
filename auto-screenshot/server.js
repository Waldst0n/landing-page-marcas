import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import { execFile } from "child_process";
import { exit } from "process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const port = Number(process.env.PORT) || 3009;

// serve a pasta dist/
const distDir = path.join(__dirname, "../dist");
if (!fs.existsSync(distDir)) {
  console.error("❌ Pasta dist não encontrada em:", distDir);
  exit(1);
}
app.use("/", express.static(distDir));

// fallback SPA — Express 5 precisa de RegExp real
app.get(/.*/, (req, res) => {
  const indexFile = path.join(distDir, "index.html");
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile);
  } else {
    res.status(404).send("index.html não encontrado em dist/");
  }
});

server.listen(port, () => {
  console.log(`🚀 Preview em http://localhost:${port}`);
  console.log(`🖼️  Gerando screenshot...`);

  const ums = process.env.TEST_PARAM || process.env.UMS || "";

  // Descobre qual script existe: .mjs ou .js
  const ssDir = __dirname; // auto-screenshot/
  const mjs = path.join(ssDir, "make-screenshot.mjs");
  const js = path.join(ssDir, "make-screenshot.js");
  const script = fs.existsSync(mjs) ? mjs : fs.existsSync(js) ? js : null;

  if (!script) {
    console.error(
      "❌ make-screenshot.{mjs|js} não encontrado em auto-screenshot/"
    );
    exit(1);
  }

  const args = [script];
  if (ums) args.push(ums);

  // Executa o Node diretamente (sem shell) para evitar problemas de path no Windows
  execFile(process.execPath, args, (error, stdout, stderr) => {
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
    if (error) {
      console.error(`❌ Erro no screenshot: ${error.message}`);
      exit(1);
    }
    console.log("✅ Screenshot gerado");
    // encerra o servidor e sai
    server.close(() => exit(0));
  });
});

process.on("SIGINT", () => {
  console.log("\n🧹 Encerrando servidor...");
  server.close(() => exit(0));
});
