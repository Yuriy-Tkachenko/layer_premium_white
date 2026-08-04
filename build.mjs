import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const output = resolve(root, "dist");
const assets = [
  "index.html", "styles.css", "sections.css", "script.js",
  "main_back.png", "image-39306.png", "about-lawyer.png",
  "green-gold-background.png",
  "icons/calendar.svg", "icons/shield.svg",
  "messengers/max.png", "messengers/telegram.png", "messengers/whatsapp.png"
];

rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
for (const asset of assets) {
  const source = resolve(root, asset);
  if (!existsSync(source)) throw new Error(`Required asset is missing: ${asset}`);
  const destination = resolve(output, asset);
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(source, destination);
}
console.log(`Static build complete: ${assets.length} assets copied to dist`);
