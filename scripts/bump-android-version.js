import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const gradlePath = path.resolve(__dirname, "../capacitor/android/app/build.gradle");

let content = fs.readFileSync(gradlePath, "utf8");

const versionCodeMatch = content.match(/versionCode (\d+)/);
const versionNameMatch = content.match(/versionName "([^"]+)"/);
if (!versionCodeMatch || !versionNameMatch) {
  throw new Error(`Could not find versionCode/versionName in ${gradlePath}`);
}

const nextVersionCode = Number(versionCodeMatch[1]) + 1;

const versionParts = versionNameMatch[1].split(".").map(Number);
versionParts[versionParts.length - 1] += 1;
const nextVersionName = versionParts.join(".");

content = content
  .replace(/versionCode \d+/, `versionCode ${nextVersionCode}`)
  .replace(/versionName "[^"]+"/, `versionName "${nextVersionName}"`);

fs.writeFileSync(gradlePath, content);

console.log(
  `Bumped Android version: versionCode ${versionCodeMatch[1]} -> ${nextVersionCode}, versionName ${versionNameMatch[1]} -> ${nextVersionName}`,
);
