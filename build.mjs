import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const sourceRoot = resolve(root, "source");
const output = resolve(root, "dist");
const assets = [
  "index.html", "css/styles.css", "css/sections.css", "js/script.js",
  "assets/images/main_back.png", "assets/images/main_back.webp",
  "assets/images/image-39306.png", "assets/images/image-39306.webp",
  "assets/images/about-lawyer.png", "assets/images/about-lawyer.webp",
  "assets/images/green-gold-background.png",
  "assets/images/green-gold-background.webp",
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
  const sourcePath = resolve(sourceRoot, asset);
  if (!existsSync(sourcePath)) throw new Error(`Required asset is missing: ${asset}`);
  const destination = resolve(output, asset);
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(sourcePath, destination);
}
console.log(`Static build complete: ${assets.length} assets copied to dist`);
