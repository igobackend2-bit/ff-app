// Run: node test-gmail.mjs
// Tests Gmail SMTP with the credentials in your .env files
import nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read .env.local first (overrides .env)
function loadEnv(file) {
  try {
    const lines = readFileSync(resolve(__dirname, file), 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { /* file not found */ }
}

loadEnv('.env');
loadEnv('.env.local'); // .env.local wins

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '');
const TEST_TO    = process.argv[2] || GMAIL_USER; // send to yourself by default

console.log('\n📧 Gmail SMTP Test');
console.log('══════════════════════════════════');
console.log('FROM :', GMAIL_USER ?? '❌ NOT SET');
console.log('PASS :', GMAIL_PASS ? `${GMAIL_PASS.slice(0,4)}${'*'.repeat(12)}` : '❌ NOT SET');
console.log('TO   :', TEST_TO);
console.log('══════════════════════════════════\n');

if (!GMAIL_USER || !GMAIL_PASS) {
  console.error('❌ GMAIL_USER or GMAIL_APP_PASSWORD not set in .env / .env.local');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host:   'smtp.gmail.com',
  port:   587,
  secure: false,
  auth:   { user: GMAIL_USER, pass: GMAIL_PASS },
});

try {
  console.log('🔌 Testing SMTP connection...');
  await transporter.verify();
  console.log('✅ SMTP connection OK\n');

  console.log('📨 Sending test email to', TEST_TO, '...');
  const info = await transporter.sendMail({
    from:    `"Farmers Factory" <${GMAIL_USER}>`,
    to:      TEST_TO,
    subject: 'Test OTP: 123456',
    text:    'Your test OTP is: 123456\n\nThis is a test from Farmers Factory.',
    html:    '<p>Your test OTP is: <strong>123456</strong></p><p>This is a test from Farmers Factory.</p>',
  });

  console.log('✅ Email sent successfully!');
  console.log('   MessageId:', info.messageId);
  console.log('\n👉 Check your inbox (also Promotions / Updates tabs in Gmail)');
} catch (err) {
  console.error('❌ Failed:', err.message);
  console.log('\n🔧 Fix:');
  console.log('   1. Go to https://myaccount.google.com/apppasswords');
  console.log('   2. Create a new App Password for "Mail"');
  console.log('   3. Update GMAIL_APP_PASSWORD in .env and .env.local');
}
