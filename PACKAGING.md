# Packaging DDD Game Hub

The web app can be distributed as an Android APK through Capacitor and as a Windows installer through Electron Builder. Both packages embed the production Vite build, so the pass-the-phone games remain available offline. Online UNO and trivia rooms still require an internet connection.

## Windows installer

Requirements: Node.js 22 or newer and npm.

```powershell
npm install
npm run desktop:installer
```

The installer is written to `release/windows/DDD-Game-Hub-Setup-<version>-x64.exe`.

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

The installable development APK is written to `release/android/DDD-Game-Hub-debug.apk`. It is signed with Android's standard debug key, which is suitable for direct testing and sharing but not for Google Play distribution.

Open the generated native project when Android Studio testing or a production-signed build is needed:

```powershell
npm run android:open
```

## Downloadable builds from GitHub

The `Build installable apps` workflow can be run manually from the repository's Actions page. Its run summary contains separate `DDD-Game-Hub-Windows` and `DDD-Game-Hub-Android` downloads.

Pushing a version tag creates a GitHub Release and attaches both installers:

```powershell
git tag v1.0.0
git push origin v1.0.0
```

## Signing for public distribution

The generated Windows installer is unsigned, so Windows SmartScreen may warn users until it is signed with a trusted code-signing certificate. A Google Play release also requires an Android upload keystore and a release build configuration. Keep those credentials outside the repository and supply them through encrypted CI secrets.
