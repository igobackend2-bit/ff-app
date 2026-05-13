async function main() {
  const email = "test-" + Date.now() + "@example.com";
  const name = "Test User";
  const phone = "+919999999999";

  console.log("1. Sending OTP...");
  const sendRes = await fetch("http://localhost:3000/api/auth/otp/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, phone }),
  });

  const sendData = await sendRes.json();
  if (!sendRes.ok) {
    console.error("Failed to send OTP:", sendData);
    return;
  }
  
  const otp = sendData.debug_otp;
  console.log(`OTP sent successfully. OTP: ${otp}`);

  if (!otp) {
    console.error("No debug_otp found in response. Is NODE_ENV=development?");
    return;
  }

  console.log("2. Verifying OTP...");
  const verifyRes = await fetch("http://localhost:3000/api/auth/otp/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, phone, otp }),
  });

  const verifyData = await verifyRes.json();
  if (verifyRes.ok) {
    console.log("SUCCESS: OTP verified!", verifyData);
  } else {
    console.error("FAILURE: Verification failed:", verifyData);
  }
}

main().catch(console.error);
