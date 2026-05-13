async function test() {
  const otp = '123456';
  const secret = 'secret';
  const text = otp + secret;

  // Method 1 (route.ts)
  const encoder1 = new TextEncoder();
  const data1 = encoder1.encode(text);
  const hashBuffer1 = await crypto.subtle.digest('SHA-256', data1);
  const hashArray1 = Array.from(new Uint8Array(hashBuffer1));
  const hashedOtp1 = hashArray1.map((b) => b.toString(16).padStart(2, '0')).join('');

  // Method 2 (auth.ts)
  const encoder2 = new TextEncoder();
  const data2 = encoder2.encode(text);
  const hashBuffer2 = await crypto.subtle.digest('SHA-256', data2);
  const hashedOtp2 = Buffer.from(hashBuffer2).toString('hex');

  console.log('Method 1:', hashedOtp1);
  console.log('Method 2:', hashedOtp2);
  console.log('Match:', hashedOtp1 === hashedOtp2);
}

test();
