import { config } from "dotenv"
import twilio from 'twilio'

config({ path: ".env.local" })

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID

if (!accountSid || !authToken || !verifySid) {
  console.error("❌ Missing Twilio credentials in .env.local")
  process.exit(1)
}

const client = twilio(accountSid, authToken)

// Test phone numbers
const testNumbers = [
  "+17602244206", // (760) 224-4206
  "+17605195930", // (760) 519-5930
  "+17602120448", // 760-212-0448
  "+17605000616", // The working number
]

async function testVerifyService() {
  console.log("🔍 Testing Twilio Verify Service...")
  console.log(`Service SID: ${verifySid}`)
  console.log(`Account SID: ${accountSid}`)
  console.log("")

  // First, get the service details
  try {
    const service = await client.verify.v2.services(verifySid).fetch()
    console.log("✅ Verify Service Details:")
    console.log(`  Name: ${service.friendlyName}`)
    console.log(`  Status: ${service.status}`)
    console.log(`  Lookup Enabled: ${service.lookupEnabled}`)
    console.log(`  Skip SMS to Landlines: ${service.skipSmsToLandlines}`)
    console.log(`  Do Not Share Warning Enabled: ${service.doNotShareWarningEnabled}`)
    console.log(`  Custom Code Enabled: ${service.customCodeEnabled}`)
    console.log("")
  } catch (error: any) {
    console.error("❌ Failed to fetch service details:", error.message)
    return
  }

  // Check if there are any rate limits
  try {
    const rateLimits = await client.verify.v2
      .services(verifySid)
      .rateLimits
      .list({ limit: 20 })

    if (rateLimits.length > 0) {
      console.log("📋 Rate Limits configured:")
      rateLimits.forEach(limit => {
        console.log(`  - ${limit.uniqueName}: ${limit.description}`)
      })
      console.log("")
    }
  } catch (error: any) {
    console.log("ℹ️ No rate limits configured or unable to fetch")
  }

  // Check verified caller IDs (for test credentials)
  try {
    console.log("📱 Checking account's verified caller IDs...")
    const callerIds = await client.validationRequests.list({ limit: 20 })

    if (callerIds.length > 0) {
      console.log("Verified Caller IDs in your account:")
      callerIds.forEach(id => {
        console.log(`  - ${id.phoneNumber} (${id.friendlyName})`)
      })
    } else {
      console.log("  No verified caller IDs found")
    }
    console.log("")
  } catch (error: any) {
    console.log("ℹ️ Unable to fetch verified caller IDs")
  }

  // Test sending verification to each number
  console.log("📤 Testing OTP send to each number...")
  console.log("")

  for (const phoneNumber of testNumbers) {
    console.log(`Testing ${phoneNumber}...`)
    try {
      const verification = await client.verify.v2
        .services(verifySid)
        .verifications.create({
          to: phoneNumber,
          channel: 'sms'
        })

      console.log(`  ✅ SUCCESS - Status: ${verification.status}`)
      console.log(`     SID: ${verification.sid}`)
      console.log(`     Valid: ${verification.valid}`)
      console.log("")
    } catch (error: any) {
      console.log(`  ❌ FAILED - ${error.message}`)
      if (error.code) {
        console.log(`     Error Code: ${error.code}`)
      }
      if (error.moreInfo) {
        console.log(`     More Info: ${error.moreInfo}`)
      }
      console.log("")
    }
  }

  console.log("✨ Test complete!")
  console.log("")
  console.log("📌 IMPORTANT NOTES:")
  console.log("1. If some numbers fail with 'unverified' errors, you need to:")
  console.log("   a) Go to https://console.twilio.com/console/phone-numbers/verified")
  console.log("   b) Add each phone number as a Verified Caller ID")
  console.log("   c) Complete the verification process for each number")
  console.log("")
  console.log("2. OR upgrade your Twilio account from trial to paid to remove restrictions")
  console.log("")
  console.log("3. The working number (+17605000616) is likely already verified or is your Twilio phone number")
}

testVerifyService().catch(console.error)