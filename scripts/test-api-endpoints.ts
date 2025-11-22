import { config } from "dotenv"

config({ path: ".env.local" })

const BASE_URL = "http://localhost:3006"

async function testSendOTP(phoneNumber: string) {
  console.log(`\n📱 Testing OTP send for: ${phoneNumber}`)

  try {
    const response = await fetch(`${BASE_URL}/api/auth/phone/send-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phoneNumber }),
    })

    const data = await response.json()

    if (response.ok) {
      console.log(`  ✅ SUCCESS: ${data.message}`)
      return true
    } else {
      console.log(`  ❌ FAILED: ${data.error}`)
      console.log(`     Status: ${response.status}`)
      return false
    }
  } catch (error: any) {
    console.log(`  ❌ ERROR: ${error.message}`)
    return false
  }
}

async function main() {
  console.log("🔍 Testing API endpoints locally...")
  console.log("Make sure the dev server is running on port 3006")
  console.log("Run: npm run dev")

  const testNumbers = [
    "(760) 224-4206",
    "760-519-5930",
    "7602120448",
    "(760) 500-0616",
  ]

  let allSuccess = true

  for (const number of testNumbers) {
    const success = await testSendOTP(number)
    if (!success) {
      allSuccess = false
    }
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  console.log("\n" + "=".repeat(50))
  if (allSuccess) {
    console.log("✅ All phone numbers can receive OTP!")
  } else {
    console.log("⚠️ Some phone numbers failed to receive OTP")
    console.log("Check the server logs for more details")
  }
}

main().catch(console.error)