import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Image,
  ActivityIndicator,
  BackHandler,
  Platform,
  StatusBar,
  Text,
  TouchableOpacity,
  PermissionsAndroid,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// ── IMPORTANT: Change this to your deployed production URL ────────────
const APP_URL = 'https://ff-app-pi.vercel.app';
// ─────────────────────────────────────────────────────────────────────

const BRAND_GREEN = '#16a34a';

// Show notifications even when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null; // emulators can't receive push

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    // Get Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '20591ce0-eadd-41cb-b09e-b57bb02088c6',
    });
    return tokenData.data;
  } catch {
    return null;
  }
}

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading]   = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [error, setError]       = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);

  // ── Register push token on startup ──────────────────────────────────
  React.useEffect(() => {
    void (async () => {
      const token = await registerForPushNotifications();
      if (token) {
        try {
          await fetch(`${APP_URL}/api/push-token`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ token, platform: Platform.OS }),
          });
        } catch { /* ignore — app works without push */ }
      }
    })();

    // Listen for push notification taps — open the app to the right page
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      if (data?.url && webViewRef.current) {
        webViewRef.current.injectJavaScript(
          `window.location.href = '${String(data.url)}'; true;`
        );
      }
    });
    return () => sub.remove();
  }, []);

  // ── Request Android permissions on startup ───────────────────────────────
  React.useEffect(() => {
    if (Platform.OS !== 'android') return;
    PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      PermissionsAndroid.PERMISSIONS.CAMERA,
    ]).catch(() => {});
  }, []);

  // Android hardware back button — go back in WebView history
  React.useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true; // prevent app exit
      }
      return false; // allow app exit
    });
    return () => sub.remove();
  }, [canGoBack]);

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="light-content" backgroundColor={BRAND_GREEN} />
        <Text style={styles.errorIcon}>🌿</Text>
        <Text style={styles.errorTitle}>Farmers Factory</Text>
        <Text style={styles.errorMsg}>
          Could not connect to the server.{'\n'}
          Please check your internet connection.
        </Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => {
            setError(false);
            setLoading(true);
            webViewRef.current?.reload();
          }}
        >
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BRAND_GREEN} />

      <WebView
        ref={webViewRef}
        source={{ uri: APP_URL }}
        style={styles.webview}

        // ── Navigation state ───────────────────────────────────────────────
        onNavigationStateChange={(state: WebViewNavigation) => setCanGoBack(state.canGoBack)}

        // ── Loading ────────────────────────────────────────────────────────
        onLoadStart={() => { if (!initialLoaded) setLoading(true); }}
        onLoadEnd={() => { setLoading(false); setInitialLoaded(true); }}
        onError={() => { setError(true); setLoading(false); }}
        onHttpError={(e) => {
          if (e.nativeEvent.statusCode >= 500) setError(true);
        }}

        // ── Performance ────────────────────────────────────────────────────
        cacheEnabled={false}
        cacheMode="LOAD_NO_CACHE"
        domStorageEnabled={true}
        javaScriptEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}

        // ── Location ──────────────────────────────────────────────────────
        geolocationEnabled={true}

        // ── Microphone & Camera permissions ───────────────────────────────
        onPermissionRequest={(e) => e.nativeEvent.request.grant(e.nativeEvent.resources)}
        mediaCapturePermissionGrantType="grantIfSameHostElseDeny"

        // ── Razorpay / popups ─────────────────────────────────────────────
        setSupportMultipleWindows={false}
        onShouldStartLoadWithRequest={(request) => {
          const url = request.url;
          if (
            url.startsWith('upi://') ||
            url.startsWith('phonepe://') ||
            url.startsWith('paytmmp://') ||
            url.startsWith('gpay://') ||
            url.startsWith('bharatpe://')
          ) {
            return false;
          }
          return true;
        }}

        // ── Security / origins ─────────────────────────────────────────────
        mixedContentMode="always"
        originWhitelist={['*', 'upi://', 'phonepe://', 'paytmmp://']}

        // ── Inject CSS & viewport ──────────────────────────────────────────
        injectedJavaScript={`
          (function() {
            var meta = document.querySelector('meta[name=viewport]');
            if (!meta) {
              meta = document.createElement('meta');
              meta.name = 'viewport';
              document.head.appendChild(meta);
            }
            meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
            var style = document.createElement('style');
            style.textContent = '::-webkit-scrollbar { display: none; } body { -webkit-overflow-scrolling: touch; }';
            document.head.appendChild(style);
          })();
          true;
        `}

        // ── User agent ─────────────────────────────────────────────────────
        userAgent="FarmersFactory-Android/1.0 (Mobile)"
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <Image
            source={require('./assets/icon.png')}
            style={styles.loadingLogo}
            resizeMode="contain"
          />
          <Text style={styles.loadingText}>Farmers Factory</Text>
          <ActivityIndicator size="large" color={BRAND_GREEN} style={{ marginTop: 20 }} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16a34a',
  },
  webview: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingLogo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#16a34a',
    letterSpacing: 0.5,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#16a34a',
    marginBottom: 12,
  },
  errorMsg: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  retryBtn: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
