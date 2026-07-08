#!/usr/bin/env node
/**
 * Applied automatically via `postinstall` after every `npm install`.
 * Required for EAS cloud builds (AGP 8 + Gradle 8 compatibility).
 */
const fs = require('fs');
const path = require('path');

function patch(filePath, description, fn) {
  if (!fs.existsSync(filePath)) {
    console.log(`[patch-android] SKIP (not found): ${description}`);
    return;
  }
  const original = fs.readFileSync(filePath, 'utf8');
  const patched  = fn(original);
  if (patched === original) {
    console.log(`[patch-android] already patched: ${description}`);
  } else {
    fs.writeFileSync(filePath, patched, 'utf8');
    console.log(`[patch-android] patched: ${description}`);
  }
}

const nm = path.join(__dirname, '..', 'node_modules');

// ── 1. expo-modules-core: make useExpoPublishing a no-op ──────────────────
patch(
  path.join(nm, 'expo-modules-core', 'android', 'ExpoModulesCorePlugin.gradle'),
  'expo-modules-core useExpoPublishing no-op',
  (src) => src.replace(
    /ext\.useExpoPublishing\s*=\s*\{[\s\S]*?\n  \}/m,
    'ext.useExpoPublishing = { /* no-op — disabled for AGP 8 compatibility */ }',
  ),
);

// ── 2. @react-native-voice/voice: add namespace, remove manifest package ──
const voiceGradle = path.join(nm, '@react-native-voice', 'voice', 'android', 'build.gradle');
patch(
  voiceGradle,
  '@react-native-voice/voice namespace',
  (src) => {
    if (src.includes('namespace')) return src; // already has it
    return src.replace(
      /android\s*\{/,
      'android {\n    namespace "com.wenkesj.voice"',
    );
  },
);

const voiceManifest = path.join(
  nm, '@react-native-voice', 'voice', 'android', 'src', 'main', 'AndroidManifest.xml',
);
patch(
  voiceManifest,
  '@react-native-voice/voice manifest package attr',
  (src) => src.replace(/\s*package="com\.wenkesj\.voice"/, ''),
);
