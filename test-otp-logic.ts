import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
const secret = process.env.NEXTAUTH_SECRET || "local-dev-secret-change-in-production-32chars";

async function hashOtp(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp + secret);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Buffer.from(hash).toString('hex');
}

async function main() {
  console.log('Using secret:', secret);
  
  const tokens = await prisma.verificationToken.findMany({
    orderBy: { expires: 'desc' },
    take: 5,
  });
  
  console.log('Latest 5 tokens in DB:');
  for (const t of tokens) {
    console.log(`- ID: ${t.identifier}, Token: ${t.token}, Expires: ${t.expires}`);
  }

  // Test a few common OTPs
  const testOtps = ['123456', '000000', '111111'];
  for (const otp of testOtps) {
    const hashed = await hashOtp(otp);
    console.log(`Test OTP: ${otp}, Hashed: ${hashed}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
