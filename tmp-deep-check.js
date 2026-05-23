const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function main() {
  const tokens = await prisma.verificationToken.findMany();
  console.log(`Found ${tokens.length} tokens`);

  const otp = '839779';
  const secret = process.env.NEXTAUTH_SECRET || 'local-dev-secret-change-in-production-32chars';

  for (const t of tokens) {
    console.log('---');
    console.log(`Identifier: ${t.identifier}`);
    console.log(`Stored Token: ${t.token}`);
    const data = otp + secret;
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    console.log(`Calc w/ Sec: ${hash}`);
    if (hash === t.token) console.log('  !! MATCH !!');
    
    const hashNoSec = crypto.createHash('sha256').update(otp).digest('hex');
    console.log(`Calc no Sec: ${hashNoSec}`);
    if (hashNoSec === t.token) console.log('  !! MATCH (NO SECRET) !!');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
