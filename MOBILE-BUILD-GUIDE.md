# Farmers Factory — Android App Build Guide
## Capacitor + Google Play Store Upload

---

## What Was Done Automatically

| Item | Status | Notes |
|------|--------|-------|
| console.log() removed | ✅ Done | 5 removed from OTP routes |
| Hardcoded secrets scan | ✅ Clean | None found |
| Release keystore generated | ✅ Done | `farmers-factory-release.jks` in project root |
| `capacitor.config.ts` created | ✅ Done | Pre-configured for Farmers Factory |
| `BUILD-ANDROID.bat` created | ✅ Done | One-click build script for Windows |
| Android signing patch | ✅ Done | `android-signing-patch.gradle` |

---

## Prerequisites (Install These First)

Before running the build script, make sure these are installed on your Windows machine:

### 1. Node.js (v18 or higher)
Download: https://nodejs.org  
Verify: `node --version`

### 2. Java JDK 17
Download: https://adoptium.net  
Verify: `java -version`

### 3. Android Studio
Download: https://developer.android.com/studio  
After install:
- Open Android Studio → SDK Manager
- Install: Android SDK Platform 34
- Install: Android Build Tools 34.0.0
- Install: Android SDK Command-line Tools

### 4. Set ANDROID_HOME environment variable
After installing Android Studio:
1. Open Windows Search → "Environment Variables"
2. Under System Variables → New:
   - Name: `ANDROID_HOME`
   - Value: `C:\Users\YourName\AppData\Local\Android\Sdk`
3. Add to `Path`: `%ANDROID_HOME%\tools` and `%ANDROID_HOME%\platform-tools`
4. Restart your terminal/command prompt

---

## Step 1: Deploy Your App to Production

> ⚠️ **Critical**: Capacitor wraps your deployed web app in a native shell.  
> You MUST have a live URL before the Android app will work.

### Option A: Deploy to Vercel (Recommended — Free)
```
1. Go to https://vercel.com → Sign up / Log in
2. Click "Add New Project" → Import from GitHub
3. Select your farmers-factory repo
4. Set these environment variables in Vercel dashboard:
   - NEXT_PUBLIC_SUPABASE_URL       = your Supabase URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY  = your Supabase anon key
   - NEXTAUTH_SECRET                = (generate: openssl rand -base64 32)
   - NEXTAUTH_URL                   = https://your-app.vercel.app
   - DATABASE_URL                   = your production PostgreSQL URL
   - RESEND_API_KEY                 = your Resend key
5. Click Deploy
6. Copy your live URL: https://farmers-factory-xxx.vercel.app
```

### Option B: Deploy to Railway
```
1. Go to https://railway.app
2. New Project → Deploy from GitHub repo
3. Add environment variables (same as above)
4. Copy your live URL
```

---

## Step 2: Update the Production URL

Open `capacitor.config.ts` in the project root and update line 18:

```typescript
server: {
  url: 'https://YOUR-ACTUAL-DOMAIN.com',  // ← Replace this
  ...
}
```

---

## Step 3: Run the Build Script

1. Open **Command Prompt as Administrator** in your project folder
2. Double-click **`BUILD-ANDROID.bat`** OR run:
   ```
   cd C:\Users\Naveen\OneDrive\Desktop\FF-APP
   BUILD-ANDROID.bat
   ```
3. The script will:
   - Install Capacitor packages
   - Initialize the Android project
   - Copy your keystore
   - Configure signing
   - Build the AAB and APK (takes 5–15 minutes)

---

## Step 4: After Build — Apply Signing Config

After `npx cap add android` creates the `android/` folder, you need to add signing config once:

Open `android/app/build.gradle` and add the `signingConfigs` block. The file `android-signing-patch.gradle` contains exactly what to paste.

Find this in `android/app/build.gradle`:
```gradle
android {
    // ... existing config
    
    buildTypes {
        release {
            // your existing release config
        }
    }
}
```

Change it to:
```gradle
android {
    // ... existing config
    
    signingConfigs {
        release {
            storeFile file(FARMERS_FACTORY_STORE_FILE)
            storePassword FARMERS_FACTORY_STORE_PASSWORD
            keyAlias FARMERS_FACTORY_KEY_ALIAS
            keyPassword FARMERS_FACTORY_KEY_PASSWORD
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

---

## Step 5: Build Output Files

After a successful build, find your files here:

| File | Path | Use For |
|------|------|---------|
| AAB (Play Store) | `android/app/build/outputs/bundle/release/app-release.aab` | Google Play Console upload |
| APK (Direct install) | `android/app/build/outputs/apk/release/app-release.apk` | Testing on your phone |

---

## Step 6: Upload to Google Play Console

### 6a. Create Developer Account (if new)
1. Go to https://play.google.com/console
2. Pay the one-time $25 registration fee
3. Fill in developer profile

### 6b. Create New App
1. Click **"Create app"**
2. App name: `Farmers Factory`
3. Default language: `English (United States)`
4. App type: `App`
5. Free or paid: `Free`
6. Accept policies → **Create app**

### 6c. Complete Store Listing
Fill in under **"Main store listing"**:
- **App name**: Farmers Factory
- **Short description** (max 80 chars): Fresh farm produce delivered to your doorstep
- **Full description** (max 4000 chars): Describe your app
- Upload **screenshots** (min 2, max 8) — phone screenshots
- Upload **app icon**: 512×512 PNG (see App Icon section below)
- Upload **feature graphic**: 1024×500 PNG

### 6d. Complete Setup Checklist
Work through each item in the left sidebar:
- **App access** → "All functionality available without special access"
- **Ads** → "No, my app does not contain ads"
- **Content rating** → Start questionnaire → Utility/Productivity → All NO → Apply rating
- **Target audience** → 18 and over
- **News app** → "No"
- **COVID contact tracing** → "No"

### 6e. Upload AAB
1. Left sidebar → **Release** → **Production**
2. Click **"Create new release"**
3. Click **"Upload"** → select `app-release.aab`
4. Release notes: `Initial release - Farmers Factory v1.0`
5. Click **"Save"** → **"Review release"** → **"Start rollout to Production"**

### 6f. Wait for Review
Google typically reviews new apps within **2–7 days** (not 2–4 hours).  
You'll receive an email when approved.

---

## App Icon & Assets

### Required sizes for Android
| Folder | Size | File |
|--------|------|------|
| mipmap-mdpi | 48×48 | ic_launcher.png |
| mipmap-hdpi | 72×72 | ic_launcher.png |
| mipmap-xhdpi | 96×96 | ic_launcher.png |
| mipmap-xxhdpi | 144×144 | ic_launcher.png |
| mipmap-xxxhdpi | 192×192 | ic_launcher.png |
| Play Store | 512×512 | (upload separately) |

### Free tools to generate icons
- **Android Asset Studio**: https://romannurik.github.io/AndroidAssetStudio/
- **Canva**: Create a 1024×1024 design, export as PNG, resize
- **Figma**: Free, professional icon design

After generating, place icons in `android/app/src/main/res/mipmap-*/ic_launcher.png`

---

## Keystore Information (KEEP SAFE!)

> ⚠️ **Never delete or lose this keystore!**  
> If you lose it, you can never update your app on Play Store.  
> Back it up to Google Drive, Dropbox, or email to yourself.

| Property | Value |
|----------|-------|
| File | `farmers-factory-release.jks` |
| Alias | `farmers-factory` |
| Store password | `FarmersFactory@2024` |
| Key password | `FarmersFactory@2024` |
| Organization | IGO Groups |
| Valid for | 10,000 days (~27 years) |

---

## Troubleshooting

### "ANDROID_HOME not set"
Set the environment variable as described in Prerequisites Step 4.

### "SDK location not found"
Open `android/local.properties` and add:
```
sdk.dir=C:\\Users\\YourName\\AppData\\Local\\Android\\Sdk
```

### Build fails: "Minimum supported Gradle version is X"
Update Gradle in `android/gradle/wrapper/gradle-wrapper.properties`:
```
distributionUrl=https\://services.gradle.org/distributions/gradle-8.0-all.zip
```

### App shows blank screen or "Site can't be reached"
- Your production URL is not set correctly in `capacitor.config.ts`
- Or your app is not deployed yet

### App blocked from loading (Mixed content)
Make sure your production URL uses `https://` not `http://`

---

## Version Numbers

Current configuration:
- **versionCode**: 1 (increment by 1 for every Play Store upload)
- **versionName**: 1.0.0
- **appId**: com.igogroups.farmersfactory

To update version, edit `android/app/build.gradle` after the Android project is created:
```gradle
defaultConfig {
    versionCode 1
    versionName "1.0.0"
}
```

---

## Summary of Files Created

| File | Purpose |
|------|---------|
| `capacitor.config.ts` | Capacitor configuration |
| `BUILD-ANDROID.bat` | One-click Windows build script |
| `android-signing-patch.gradle` | Signing config snippet for build.gradle |
| `farmers-factory-release.jks` | Release keystore (KEEP SAFE!) |
| `MOBILE-BUILD-GUIDE.md` | This guide |

---

*Generated for Farmers Factory by IGO Groups — marketing@igogroups.com*
