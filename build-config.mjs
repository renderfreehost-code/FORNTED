import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const source = path.join(__dirname, "public");
const dist = path.join(__dirname, "dist");
const apiBase = (process.env.FRONTEND_API_URL || "").replace(/\/$/, "");

await fs.rm(dist, { recursive: true, force: true });
await fs.cp(source, dist, { recursive: true });
await fs.writeFile(path.join(dist, "config.js"), `window.API_BASE_URL = ${JSON.stringify(apiBase)};\n`, "utf8");

console.log(`Frontend build ready. API base: ${apiBase || "(same origin)"}`);
