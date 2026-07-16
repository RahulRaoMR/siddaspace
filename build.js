const fs = require("fs");
const path = require("path");

const rootDir = __dirname;
const outDir = path.join(rootDir, "dist");
const filesToCopy = [
  "index.html",
  "estimate.html",
  "styles.css",
  "script.js",
  "assets",
];

if (!outDir.startsWith(rootDir + path.sep)) {
  throw new Error("Refusing to write outside the project folder.");
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const entry of filesToCopy) {
  const source = path.join(rootDir, entry);
  const target = path.join(outDir, entry);

  if (!fs.existsSync(source)) {
    continue;
  }

  fs.cpSync(source, target, { recursive: true });
}

console.log("Static site copied to dist");
