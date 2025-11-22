import { config } from "dotenv"
import twilio from 'twilio'

config({ path: ".env.local" })

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID

console.log("Testing Twilio credentials...")
console.log("Account SID:", accountSid)
console.log("Verify Service SID:", verifySid)
console.log("")

if (!accountSid || !authToken) {
  console.error("❌ Missing Twilio credentials in .env.local")
  process.exit(1)
}

const client = twilio(accountSid, authToken)

async function testAccount() {
  try {
    // Test if credentials are valid by fetching account info
    const account = await client.api.accounts(accountSid).fetch()
    console.log("✅ Account is valid!")
    console.log("  Status:", account.status)
    console.log("  Friendly Name:", account.friendlyName)
    console.log("  Type:", account.type)
    console.log("")
  } catch (error: any) {
    console.error("❌ Failed to authenticate:", error.message)
    return false
  }

  // List all Verify services to find the correct one
  try {
    console.log("📋 Looking for Verify Services...")
    const services = await client.verify.v2.services.list({ limit: 20 })

    if (services.length === 0) {
      console.log("  No Verify Services found. You may need to create one.")
      console.log("")
      console.log("Creating a new Verify Service...")

      try {
        const newService = await client.verify.v2.services.create({
          friendlyName: 'LashPop Verify'
        })

        console.log("✅ New Verify Service created!")
        console.log("  Service SID:", newService.sid)
        console.log("  Friendly Name:", newService.friendlyName)
        console.log("")
        console.log("⚠️  UPDATE YOUR .env.local WITH THIS SERVICE SID:", newService.sid)
      } catch (createError: any) {
        console.error("❌ Failed to create service:", createError.message)
      }
    } else {
      console.log(`  Found ${services.length} Verify Service(s):`)
      services.forEach(service => {
        console.log(`  - ${service.sid}: ${service.friendlyName}`)
      })
      console.log("")

      // Check if the configured service ID exists
      const configuredService = services.find(s =>
        s.sid === verifySid ||
        s.sid === `VA${verifySid}` ||
        s.sid.includes(verifySid)
      )

      if (configuredService) {
        console.log(`✅ Found matching service: ${configuredService.sid}`)
        if (configuredService.sid !== verifySid) {
          console.log(`⚠️  UPDATE YOUR .env.local WITH THE CORRECT SERVICE SID: ${configuredService.sid}`)
        }
      } else {
        console.log(`⚠️  The configured service ID (${verifySid}) doesn't match any existing services`)
        console.log("   Use one of the Service SIDs listed above in your .env.local")
      }
    }
  } catch (error: any) {
    console.error("❌ Failed to list Verify services:", error.message)
  }

  return true
}

testAccount().catch(console.error)