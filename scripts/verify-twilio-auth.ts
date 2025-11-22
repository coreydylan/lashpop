import { config } from "dotenv"
import twilio from 'twilio'

config({ path: ".env.local" })

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID

console.log("🔍 Verifying Twilio Credentials...")
console.log("")
console.log("Account SID:", accountSid)
console.log("Auth Token:", authToken ? `${authToken.substring(0, 4)}...${authToken.substring(authToken.length - 4)}` : "NOT SET")
console.log("Verify Service SID:", verifySid)
console.log("")

if (!accountSid || !authToken || !verifySid) {
  console.error("❌ Missing credentials")
  process.exit(1)
}

const client = twilio(accountSid, authToken)

async function verifyAuth() {
  // Test 1: Try to fetch account info
  console.log("Test 1: Fetching account info...")
  try {
    const account = await client.api.v2010.accounts(accountSid).fetch()
    console.log("✅ Authentication successful!")
    console.log("  Account Name:", account.friendlyName)
    console.log("  Status:", account.status)
    console.log("  Type:", account.type)
  } catch (error: any) {
    console.log("❌ Authentication failed!")
    console.log("  Error:", error.message)
    console.log("  Code:", error.code)
    if (error.code === 20003) {
      console.log("  This means the Account SID or Auth Token is incorrect")
    }
    return false
  }

  // Test 2: Try to fetch the Verify service
  console.log("\nTest 2: Fetching Verify service...")
  try {
    const service = await client.verify.v2.services(verifySid).fetch()
    console.log("✅ Verify service found!")
    console.log("  Service Name:", service.friendlyName)
    console.log("  Service SID:", service.sid)
  } catch (error: any) {
    console.log("❌ Verify service not found!")
    console.log("  Error:", error.message)
    console.log("  This means the Verify Service SID is incorrect or doesn't belong to this account")
    return false
  }

  // Test 3: Send a test verification
  console.log("\nTest 3: Sending test verification to +17605000616...")
  try {
    const verification = await client.verify.v2
      .services(verifySid)
      .verifications
      .create({
        to: '+17605000616',
        channel: 'sms'
      })
    console.log("✅ Test verification sent!")
    console.log("  Status:", verification.status)
    console.log("  SID:", verification.sid)
  } catch (error: any) {
    console.log("❌ Failed to send verification!")
    console.log("  Error:", error.message)
    console.log("  Code:", error.code)
  }

  return true
}

verifyAuth().then(success => {
  if (success) {
    console.log("\n✅ All tests passed! Credentials are valid.")
  } else {
    console.log("\n❌ Some tests failed. Check the credentials.")
    console.log("\nProvided credentials:")
    console.log("TWILIO_ACCOUNT_SID=", accountSid)
    console.log("TWILIO_AUTH_TOKEN=", authToken)
    console.log("TWILIO_VERIFY_SERVICE_SID=", verifySid)
  }
})