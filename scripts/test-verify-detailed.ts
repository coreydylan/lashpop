import { config } from "dotenv"
import twilio from 'twilio'

config({ path: ".env.local" })

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID

if (!accountSid || !authToken || !verifySid) {
  console.error("❌ Missing Twilio credentials")
  process.exit(1)
}

const client = twilio(accountSid, authToken)

async function testPhoneVerification() {
  console.log("🔍 Testing Twilio Verify details...\n")
  console.log("Service SID:", verifySid)

  // Check if there are any verification attempts in the last hour
  try {
    console.log("\n📱 Recent verification attempts:")
    const verifications = await client.verify.v2
      .services(verifySid)
      .verifications
      .list({ limit: 20 })

    console.log(`Found ${verifications.length} recent verifications:\n`)

    verifications.forEach(v => {
      console.log(`Phone: ${v.to}`)
      console.log(`  Status: ${v.status}`)
      console.log(`  Channel: ${v.channel}`)
      console.log(`  Valid: ${v.valid}`)
      console.log(`  Created: ${v.dateCreated}`)
      console.log(`  Updated: ${v.dateUpdated}`)
      console.log(`  Attempts: ${JSON.stringify(v.sendCodeAttempts)}`)
      console.log("")
    })

    // Check verification checks (when someone enters a code)
    console.log("\n🔐 Recent verification checks (code entries):")
    const checks = await client.verify.v2
      .services(verifySid)
      .verificationChecks
      .list({ limit: 20 })

    console.log(`Found ${checks.length} recent checks:\n`)

    checks.forEach(c => {
      console.log(`Phone: ${c.to}`)
      console.log(`  Status: ${c.status}`)
      console.log(`  Channel: ${c.channel}`)
      console.log(`  Valid: ${c.valid}`)
      console.log(`  Created: ${c.dateCreated}`)
      console.log("")
    })

  } catch (error: any) {
    console.error("Error fetching verifications:", error.message)
  }

  // Test creating a verification for a specific number
  const testNumber = "+17602244206"
  console.log(`\n🧪 Testing verification for ${testNumber}...`)

  try {
    const verification = await client.verify.v2
      .services(verifySid)
      .verifications
      .create({
        to: testNumber,
        channel: 'sms'
      })

    console.log("✅ Verification created:")
    console.log(`  SID: ${verification.sid}`)
    console.log(`  Status: ${verification.status}`)
    console.log(`  To: ${verification.to}`)
    console.log(`  Channel: ${verification.channel}`)
    console.log(`  Valid: ${verification.valid}`)
    console.log(`  Lookup: ${JSON.stringify(verification.lookup)}`)
    console.log(`  Amount: ${verification.amount}`)
    console.log(`  Payee: ${verification.payee}`)

    // Now test with a fake code to see the error
    console.log("\n🔍 Testing with incorrect code '123456'...")
    try {
      const check = await client.verify.v2
        .services(verifySid)
        .verificationChecks
        .create({
          to: testNumber,
          code: '123456'
        })
      console.log(`  Result: ${check.status}`)
      console.log(`  Valid: ${check.valid}`)
    } catch (checkError: any) {
      console.log(`  Error: ${checkError.message}`)
    }

  } catch (error: any) {
    console.error("Error creating verification:", error.message)
    console.error("Error code:", error.code)
    console.error("More info:", error.moreInfo)
  }
}

testPhoneVerification().catch(console.error)