import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const otp = '839779';
const secret = process.env.NEXTAUTH_SECRET || 'local-dev-secret-change-in-production-32chars';

function hashOtp(otp: string, secret: string) {
  const data = otp + secret;
  return crypto.createHash('sha256').update(data).digest('hex');
}

console.log('Secret:', secret);
console.log('OTP:', otp);
console.log('Hashed OTP:', hashOtp(otp, secret));
