import { config } from "dotenv"
import twilio from 'twilio'

config({ path: ".env.local" })

// Current credentials from .env.local
const currentSid = process.env.TWILIO_ACCOUNT_SID
const currentToken = process.env.TWILIO_AUTH_TOKEN
const currentVerifySid = process.env.TWILIO_VERIFY_SERVICE_SID

// Old credentials from environment variables
// Set these as environment variables when running the script:
// OLD_TWILIO_ACCOUNT_SID=xxx OLD_TWILIO_AUTH_TOKEN=xxx OLD_TWILIO_VERIFY_SERVICE_SID=xxx npm run script:compare-twilio
const oldSid = process.env.OLD_TWILIO_ACCOUNT_SID
const oldToken = process.env.OLD_TWILIO_AUTH_TOKEN
const oldVerifySid = process.env.OLD_TWILIO_VERIFY_SERVICE_SID

console.log("🔍 Comparing Twilio Accounts\n")

async function testAccount(name: string, sid: string | undefined, token: string | undefined, verifySid: string | undefined) {
  console.log(`\n${name}:`)
  console.log("================")

  if (!sid || !token) {
    console.log("❌ Missing credentials")
    return
  }

  try {
    const client = twilio(sid, token)

    // Test basic connection
    const account = await client.api.v2010.accounts(sid).fetch()
    console.log("✅ Account active:", account.status)
    console.log("   Type:", account.type)
    console.log("   Created:", account.dateCreated)

    // Test Verify service if provided
    if (verifySid) {
      try {
        const service = await client.verify.v2.services(verifySid).fetch()
        console.log("✅ Verify service active:", service.friendlyName)
      } catch (verifyError: any) {
        console.log("❌ Verify service error:", verifyError.message)
      }
    } else {
      console.log("⚠️  No Verify service SID provided")
    }

  } catch (error: any) {
    console.log("❌ Connection failed:", error.message)
  }
}

async function main() {
  if (!oldSid || !oldToken) {
    console.log("⚠️  Old credentials not provided. Set OLD_TWILIO_ACCOUNT_SID, OLD_TWILIO_AUTH_TOKEN, and OLD_TWILIO_VERIFY_SERVICE_SID environment variables to compare.")
    console.log("\nTesting current credentials only...")
    await testAccount("Current Credentials", currentSid, currentToken, currentVerifySid)
  } else {
    await testAccount("Current Credentials", currentSid, currentToken, currentVerifySid)
    await testAccount("Old Credentials", oldSid, oldToken, oldVerifySid)

    console.log("\n\n📊 Comparison Summary:")
    console.log("======================")
    console.log("Current SID:", currentSid?.substring(0, 10) + "...")
    console.log("Old SID:    ", oldSid?.substring(0, 10) + "...")
    console.log("Same account?", currentSid === oldSid ? "✅ Yes" : "❌ No")
  }
}

main().catch(console.error)