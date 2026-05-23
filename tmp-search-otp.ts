import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
const secret = "local-dev-secret-dont-change-in-production-32chars";

async function hashOtp(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp + secret);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Buffer.from(hash).toString('hex');
}

async function main() {
  const otp = '310462';
  const hashed = await hashOtp(otp);
  console.log('OTP:', otp);
  console.log('Hashed:', hashed);
  
  const token = await prisma.verificationToken.findFirst({
    where: { token: hashed }
  });
  
  if (token) {
    console.log('TOKEN FOUND:', token);
  } else {
    console.log('TOKEN NOT FOUND IN DATABASE');
    
    // Check all tokens from today
    const tokens = await prisma.verificationToken.findMany({
      where: {
        expires: {
          gt: new Date(new Date().setHours(0,0,0,0))
        }
      }
    });
    console.log(`Searching through ${tokens.length} tokens from today...`);
    tokens.forEach(t => {
      console.log(`Token in DB: ${t.token.substring(0, 8)}... for ${t.identifier}`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
