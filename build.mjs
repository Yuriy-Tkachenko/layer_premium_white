import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const output = resolve(root, "dist");
const assets = [
  "index.html", "styles.css", "sections.css", "script.js",
  "main_back.png", "image-39306.png", "about-lawyer.png",
  "green-gold-background.png",
  "fonts/cormorant-garamond-cyrillic.woff2",
  "fonts/cormorant-garamond-latin.woff2",
  "fonts/manrope-cyrillic.woff2",
  "fonts/manrope-latin.woff2",
  "icons/calendar.svg", "icons/image 39323 [Vectorized].svg",
  "icons/benefit-shield.svg", "icons/benefit-scales.svg",
  "icons/benefit-collegium.svg",
  "messengers/max.svg", "messengers/telegram.svg", "messengers/whatsapp.svg"
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
