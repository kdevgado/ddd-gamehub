# Packaging DDD Game Hub

The web app can be distributed as an Android APK through Capacitor and as a Windows installer through Electron Builder. Both packages embed the production Vite build, so the pass-the-phone games remain available offline. Online UNO and trivia rooms still require an internet connection.

## Windows installer

Requirements: Node.js 22 or newer and npm.

```powershell
npm install
npm run desktop:installer
```

The installer is written to `release/windows/DDD-Game-Hub-Windows-Setup.exe`.

To test the desktop wrapper without creating an installer:

```powershell
npm run desktop:run
```

## Android APK

Local Android builds require Node.js 22 or newer, Android Studio 2025.2.1 or newer, and Android SDK 36. Android Studio installs a compatible JDK.

```powershell
npm install
npm run android:apk
```

`android:apk` creates a release APK and intentionally fails unless all four signing variables are present:

- `ANDROID_KEYSTORE_PATH`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

The signed APK and its SHA-256 checksum are written to `release/android/`. Keep the same release key for the lifetime of the app; Android only accepts updates signed by the same identity.

For local device testing only, use the explicitly named debug command:

```powershell
npm run android:apk:debug
```

Never attach that debug APK to a public release.

Open the generated native project when Android Studio testing or a production-signed build is needed:

```powershell
npm run android:open
```

## Downloadable builds from GitHub

The `Build installable apps` workflow can be run manually from the repository's Actions page. Its run summary contains separate `DDD-Game-Hub-Windows` and `DDD-Game-Hub-Android` downloads. Android publishing requires these encrypted Actions secrets:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

CI refuses Android debug certificates, verifies the APK signature and checksum, and creates a GitHub build-provenance attestation. Tagged releases attach the APK and `.sha256` file.

Pushing a version tag creates a GitHub Release and attaches both installers:

```powershell
git tag v1.0.4
git push origin v1.0.4
```

## Signing for public distribution

Back up the Android release keystore and credentials in at least two encrypted locations. Do not commit either one. Losing the key prevents direct-download users from installing future versions as updates; exposing it lets someone impersonate the publisher.

The pinned DDD Game Hub Android release certificate has this SHA-256 fingerprint:

```text
B9213DE90134A8F90970E63F575A070C9D6F32D694141C03BA3884EAFE620F83
```

CI refuses to publish an APK whose signing certificate does not match this fingerprint.

GitHub-hosted APKs are sideloaded apps, so Android can still show an "unknown app/source" warning even when the APK is correctly release-signed. Google Play distribution with Play App Signing provides the clearest public install experience. For direct downloads, publish the SHA-256 checksum and link to the GitHub provenance attestation so users can verify the file.

The generated Windows installer remains unsigned, so Windows SmartScreen may warn users until it is signed with a trusted code-signing certificate.
