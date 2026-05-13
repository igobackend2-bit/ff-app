import crypto from 'crypto';

const secret = 'farmers-factory-secret-123'; // Example secret

async function hashOtp(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp + secret);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Buffer.from(hash).toString('hex');
}

async function test() {
  const otp = '123456';
  const h1 = await hashOtp(otp);
  const h2 = await hashOtp(otp);
  console.log('OTP:', otp);
  console.log('Hash 1:', h1);
  console.log('Hash 2:', h2);
  console.log('Match:', h1 === h2);
}

test();
