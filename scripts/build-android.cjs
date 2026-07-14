const { copyFileSync, existsSync, mkdirSync } = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");
const androidDirectory = path.join(projectRoot, "android");
const gradleCommand = process.platform === "win32" ? "gradlew.bat" : "./gradlew";

const result = spawnSync(gradleCommand, ["assembleDebug"], {
  cwd: androidDirectory,
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const sourceApk = path.join(androidDirectory, "app", "build", "outputs", "apk", "debug", "app-debug.apk");
if (!existsSync(sourceApk)) {
  console.error(`Android build succeeded but no APK was found at ${sourceApk}`);
  process.exit(1);
}

const releaseDirectory = path.join(projectRoot, "release", "android");
const releaseApk = path.join(releaseDirectory, "DDD-Game-Hub-debug.apk");
mkdirSync(releaseDirectory, { recursive: true });
copyFileSync(sourceApk, releaseApk);
console.log(`APK ready: ${releaseApk}`);
