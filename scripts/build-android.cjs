const { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } = require("node:fs");
const { createHash } = require("node:crypto");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");
const androidDirectory = path.join(projectRoot, "android");
const gradleCommand = process.platform === "win32" ? "gradlew.bat" : "./gradlew";
const debugBuild = process.argv.includes("--debug");
const buildVariant = debugBuild ? "debug" : "release";
const gradleTask = debugBuild ? "assembleDebug" : "assembleRelease";

if (!debugBuild) {
  const requiredSigningVariables = [
    "ANDROID_KEYSTORE_PATH",
    "ANDROID_KEYSTORE_PASSWORD",
    "ANDROID_KEY_ALIAS",
    "ANDROID_KEY_PASSWORD"
  ];
  const missingVariables = requiredSigningVariables.filter((name) => !process.env[name]);
  if (missingVariables.length) {
    console.error(`Release signing is not configured. Missing: ${missingVariables.join(", ")}`);
    process.exit(1);
  }
}

const result = spawnSync(gradleCommand, [gradleTask], {
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

const sourceApk = path.join(
  androidDirectory,
  "app",
  "build",
  "outputs",
  "apk",
  buildVariant,
  `app-${buildVariant}.apk`
);
if (!existsSync(sourceApk)) {
  console.error(`Android build succeeded but no APK was found at ${sourceApk}`);
  process.exit(1);
}

const releaseDirectory = path.join(projectRoot, "release", "android");
const releaseApk = path.join(releaseDirectory, "DDD-Game-Hub-Android.apk");
mkdirSync(releaseDirectory, { recursive: true });
copyFileSync(sourceApk, releaseApk);
const checksum = createHash("sha256").update(readFileSync(releaseApk)).digest("hex");
const checksumFile = `${releaseApk}.sha256`;
writeFileSync(checksumFile, `${checksum}  ${path.basename(releaseApk)}\n`);
console.log(`${debugBuild ? "Debug" : "Signed release"} APK ready: ${releaseApk}`);
console.log(`SHA-256: ${checksum}`);
