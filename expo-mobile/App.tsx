import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
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

// ── IMPORTANT: Change this to your deployed production URL ────────────
const APP_URL = 'https://ff-app-pi-ten.vercel.app';
// ─────────────────────────────────────────────────────────────────────

const BRAND_GREEN = '#16a34a';

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);

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
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => { setError(true); setLoading(false); }}
        onHttpError={(e) => {
          if (e.nativeEvent.statusCode >= 500) setError(true);
        }}

        // ── Performance ────────────────────────────────────────────────────
        cacheEnabled={true}
        domStorageEnabled={true}
        javaScriptEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}

        // ── Location ──────────────────────────────────────────────────────
        // Enables HTML5 navigator.geolocation inside the WebView
        geolocationEnabled={true}

        // ── Microphone & Camera permissions ───────────────────────────────
        // Auto-grant mic/camera/location requests from the WebView
        onPermissionRequest={(e) => e.nativeEvent.request.grant(e.nativeEvent.resources)}
        mediaCapturePermissionGrantType="grantIfSameHostElseDeny"

        // ── Razorpay / popups (FIX #4) ────────────────────────────────────
        // Allow Razorpay and other payment gateways that open new windows
        setSupportMultipleWindows={false}
        // Keep Razorpay checkout.js working inside WebView
        allowsInlineMediaPlayback={true}
        // Allow all navigation including payment gateway redirects
        onShouldStartLoadWithRequest={(request) => {
          // Allow Razorpay and UPI deep links
          const url = request.url;
          if (
            url.startsWith('upi://') ||
            url.startsWith('phonepe://') ||
            url.startsWith('paytmmp://') ||
            url.startsWith('gpay://') ||
            url.startsWith('bharatpe://')
          ) {
            // These are UPI app deep links — can't open them in WebView
            // They will be handled by the OS
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
            // Set app-like meta viewport
            var meta = document.querySelector('meta[name=viewport]');
            if (!meta) {
              meta = document.createElement('meta');
              meta.name = 'viewport';
              document.head.appendChild(meta);
            }
            meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
            // Hide scrollbars
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
          <Text style={styles.loadingLogo}>🌿</Text>
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
    fontSize: 64,
    marginBottom: 8,
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
