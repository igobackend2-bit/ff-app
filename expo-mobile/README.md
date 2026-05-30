# Farmers Factory — Expo Mobile App

Wraps the Farmers Factory web app in a native Android/iOS shell using Expo.
No Java, no Android Studio, no Android SDK needed — builds in the cloud.

## Files in this folder

| File | Purpose |
|------|---------|
| `App.tsx` | Main app — WebView that loads your website |
| `app.json` | Expo config (app name, bundle ID, icons) |
| `eas.json` | Build profiles (APK vs AAB) |
| `BUILD-WITH-EXPO.bat` | One-click build script |

## Quick Start (3 steps)

### Step 1 — Update your production URL
Open `App.tsx` line 9 and change:
```
const APP_URL = 'https://farmersfactory.igogroups.com';
```
to your actual deployed URL.

### Step 2 — Create free Expo account
Go to https://expo.dev → Sign Up (free)

### Step 3 — Run the build script
Double-click `BUILD-WITH-EXPO.bat`
- Choose 1 for APK (testing)
- Choose 2 for AAB (Play Store)

Your build runs in the cloud. Download link sent to your email in ~10 minutes.

## Manual commands

```bash
# Install
npm install
npm install -g eas-cli

# Login
eas login

# Build APK (for testing - direct install)
eas build --platform android --profile preview

# Build AAB (for Play Store)
eas build --platform android --profile production

# Submit to Play Store (after uploading once manually)
eas submit --platform android
```

## Keystore (signing)
EAS manages the keystore automatically in the cloud.
You can also bring your own: `eas credentials`

## App details
- Package: com.igogroups.farmersfactory
- Version: 1.0.0
- Min Android: 6.0 (API 23)
