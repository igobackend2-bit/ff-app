import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor configuration for Farmers Factory Android/iOS app.
 *
 * IMPORTANT: Before building, update `server.url` to your production URL.
 * The app loads your deployed Next.js site in a native WebView.
 *
 * Local dev:  url: 'http://10.0.2.2:3001'  (Android emulator → localhost)
 * Production: url: 'https://your-domain.com'
 */
const config: CapacitorConfig = {
  appId: 'com.igogroups.farmersfactory',
  appName: 'Farmers Factory',
  webDir: 'out',  // Used for static export only; ignored when server.url is set

  server: {
    // ── UPDATE THIS to your live production URL before building ──
    url: 'https://farmersfactory.igogroups.com',
    cleartext: false,  // disallow HTTP in production
    androidScheme: 'https',
  },

  android: {
    backgroundColor: '#ffffff',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,  // set true only for debugging
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#16a34a',   // Farmers Factory green
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    StatusBar: {
      style: 'Light',
      backgroundColor: '#16a34a',
    },
  },
};

export default config;
