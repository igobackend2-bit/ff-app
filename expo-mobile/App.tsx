import React, { useRef, useState, useCallback } from 'react';
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
  Alert,
  AppState,
  AppStateStatus,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import Voice from '@react-native-voice/voice';
import AsyncStorage from '@react-native-async-storage/async-storage';

const APP_URL = 'https://ff-app-pi-ten.vercel.app';
const SB      = 'https://qwiumswrbddwmlraktvy.supabase.co';
const SB_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXVtc3dyYmRkd21scmFrdHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjU3NTIsImV4cCI6MjA5NTcwMTc1Mn0.AsY045N7wHqMF_2P0-D2Ouzrkphjfkb4CP6ImhSm-tc';
const BRAND_GREEN = '#16a34a';
const LAST_NOTIF_KEY = 'ff_last_notif_ts';

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading]         = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [error, setError]             = useState(false);
  const [canGoBack, setCanGoBack]     = useState(false);

  // Fetch recent admin notifications and show any new ones as alerts
  const checkNotifications = useCallback(async () => {
    try {
      const lastTs = await AsyncStorage.getItem(LAST_NOTIF_KEY).catch(() => null) ?? '1970-01-01T00:00:00Z';
      const res = await fetch(
        `${SB}/rest/v1/notifications?select=id,title,message,created_at&order=created_at.desc&limit=5`,
        { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } },
      );
      if (!res.ok) return;
      const rows = await res.json() as Array<{ id: string; title: string; message: string; created_at: string }>;
      const newRows = rows.filter((r) => r.created_at > lastTs);
      if (newRows.length > 0) {
        // Save the latest timestamp
        await AsyncStorage.setItem(LAST_NOTIF_KEY, newRows[0]!.created_at).catch(() => {});
        // Show each new notification as an alert (most recent first)
        for (const r of newRows) {
          Alert.alert(r.title ?? 'Farmers Factory', r.message ?? '');
        }
      }
    } catch { /* ignore network errors */ }
  }, []);

  // Request Android permissions on startup + check for notifications
  React.useEffect(() => {
    if (Platform.OS === 'android') {
      PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.CAMERA,
      ]).catch(() => {});
    }

    // Check on startup
    void checkNotifications();

    // Check again every time the app comes to foreground
    const handleAppState = (next: AppStateStatus) => {
      if (next === 'active') void checkNotifications();
    };
    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [checkNotifications]);

  // ── Native voice search — bridges device speech recognition into the web app ──
  const injectVoice = (fn: string, arg?: string) => {
    const a = arg !== undefined ? JSON.stringify(arg) : '';
    webViewRef.current?.injectJavaScript(`window.${fn} && window.${fn}(${a}); true;`);
  };

  React.useEffect(() => {
    Voice.onSpeechStart  = () => injectVoice('__ffVoiceState', 'start');
    Voice.onSpeechEnd    = () => injectVoice('__ffVoiceState', 'end');
    Voice.onSpeechResults = (e) => {
      const text = e.value?.[0] ?? '';
      if (text) injectVoice('__ffVoiceResult', text);
    };
    Voice.onSpeechError = (e) => {
      const code = e.error?.code ?? '';
      const mapped =
        /permission|denied/i.test(String(code)) ? 'permission' :
        /no.?match|no.?speech|7|6/i.test(String(code)) ? 'no-speech' : 'error';
      injectVoice('__ffVoiceError', mapped);
    };
    return () => { Voice.destroy().then(Voice.removeAllListeners).catch(() => {}); };
  }, []);

  const startVoice = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone permission',
            message: 'Farmers Factory needs the microphone for voice search.',
            buttonPositive: 'Allow',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          injectVoice('__ffVoiceError', 'permission');
          return;
        }
      }
      await Voice.destroy().catch(() => {});
      await Voice.start('en-IN');
    } catch {
      injectVoice('__ffVoiceError', 'error');
    }
  };

  const stopVoice = async () => { try { await Voice.stop(); } catch { /* ignore */ } };

  // Android hardware back button — go back in WebView history
  React.useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
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

        onNavigationStateChange={(state: WebViewNavigation) => setCanGoBack(state.canGoBack)}

        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data) as { type?: string };
            if (data.type === 'FF_VOICE_START') void startVoice();
            else if (data.type === 'FF_VOICE_STOP') void stopVoice();
          } catch { /* ignore non-JSON messages */ }
        }}

        onLoadStart={() => { if (!initialLoaded) setLoading(true); }}
        onLoadEnd={() => { setLoading(false); setInitialLoaded(true); }}
        onError={() => { setError(true); setLoading(false); }}
        onHttpError={(e) => {
          if (e.nativeEvent.statusCode >= 500) setError(true);
        }}

        cacheEnabled={false}
        cacheMode="LOAD_NO_CACHE"
        domStorageEnabled={true}
        javaScriptEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        geolocationEnabled={true}

        onPermissionRequest={(e) => e.nativeEvent.request.grant(e.nativeEvent.resources)}
        mediaCapturePermissionGrantType="grantIfSameHostElseDeny"

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

        mixedContentMode="always"
        originWhitelist={['*', 'upi://', 'phonepe://', 'paytmmp://']}

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
  container:       { flex: 1, backgroundColor: '#16a34a' },
  webview:         { flex: 1, backgroundColor: '#ffffff' },
  loadingOverlay:  {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingLogo:     { width: 120, height: 120, marginBottom: 16 },
  loadingText:     { fontSize: 24, fontWeight: '700', color: '#16a34a', letterSpacing: 0.5 },
  errorContainer:  { flex: 1, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorIcon:       { fontSize: 64, marginBottom: 16 },
  errorTitle:      { fontSize: 22, fontWeight: '700', color: '#16a34a', marginBottom: 12 },
  errorMsg:        { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  retryBtn:        { backgroundColor: '#16a34a', paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12 },
  retryText:       { color: '#fff', fontSize: 16, fontWeight: '600' },
});
