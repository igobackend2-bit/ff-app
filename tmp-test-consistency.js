const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function main() {
  const email = 'test-debug@example.com';
  const otp = '123456';
  const secret = process.env.NEXTAUTH_SECRET || 'local-dev-secret-change-in-production-32chars';

  // 1. Calculate hash exactly like in route.ts
  const encoder = new TextEncoder();
  const data = encoder.encode(otp + secret);
  const hashBuffer = await crypto.webcrypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashedOtp = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  console.log(`Email: ${email}`);
  console.log(`OTP: ${otp}`);
  console.log(`Secret: ${secret}`);
  console.log(`Calculated Hash: ${hashedOtp}`);

  // 2. Store in DB
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: hashedOtp,
      expires: new Date(Date.now() + 50000),
    }
  });

  // 3. Retrieve and verify
  const stored = await prisma.verificationToken.findFirst({ where: { identifier: email } });
  console.log(`Stored Hash:     ${stored.token}`);
  console.log(`Matches local:   ${stored.token === hashedOtp}`);

  // 4. Test crypto.createHash (Node.js) vs crypto.subtle (Web Crypto)
  const nodeHash = crypto.createHash('sha256').update(otp + secret).digest('hex');
  console.log(`Node.js Hash:    ${nodeHash}`);
  console.log(`Matches Web:     ${nodeHash === hashedOtp}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
