const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function main() {
  const tokens = await prisma.verificationToken.findMany({
    orderBy: { expires: 'desc' },
    take: 1,
  });
  
  if (tokens.length === 0) {
    console.log('No tokens found');
    return;
  }

  const token = tokens[0];
  console.log('Latest Token:', JSON.stringify(token, null, 2));

  // Check common secrets
  const secrets = [
    'local-dev-secret-change-in-production-32chars',
    ''
  ];

  const otpEntered = '839779'; // from screenshot

  for (const secret of secrets) {
    const data = otpEntered + secret;
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    console.log(`Hash for OTP ${otpEntered} with secret "${secret}": ${hash}`);
    if (hash === token.token) {
      console.log('MATCH FOUND!');
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
