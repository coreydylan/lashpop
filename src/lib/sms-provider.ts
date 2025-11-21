/**
 * SMS Provider - Twilio Verify API
 *
 * Handles OTP verification via Twilio Verify and other SMS messages
 */

import twilio from 'twilio'

// Initialize Twilio client (lazy loaded)
let twilioClient: ReturnType<typeof twilio> | null = null

function getTwilioClient() {
  console.log('[SMS-PROVIDER] getTwilioClient called, existing client:', !!twilioClient)

  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN

    console.log('[SMS-PROVIDER] Account SID:', accountSid?.substring(0, 10) + '...')
    console.log('[SMS-PROVIDER] Auth Token exists:', !!authToken)
    console.log('[SMS-PROVIDER] Auth Token length:', authToken?.length)

    if (!accountSid || !authToken) {
      console.error('[SMS-PROVIDER] ERROR: Missing Twilio credentials')
      console.error('[SMS-PROVIDER] Account SID present:', !!accountSid)
      console.error('[SMS-PROVIDER] Auth Token present:', !!authToken)
      throw new Error('Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.')
    }

    console.log('[SMS-PROVIDER] Creating new Twilio client...')
    twilioClient = twilio(accountSid, authToken)
    console.log('[SMS-PROVIDER] Twilio client created successfully')
  }

  return twilioClient
}

export interface SendSMSParams {
  to: string
  message: string
}

/**
 * Send an SMS message via Twilio (for non-OTP messages)
 */
export async function sendSMS({ to, message }: SendSMSParams): Promise<void> {
  const client = getTwilioClient()
  const fromNumber = process.env.TWILIO_PHONE_NUMBER

  if (!fromNumber) {
    throw new Error('Twilio phone number not configured. Set TWILIO_PHONE_NUMBER.')
  }

  try {
    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: to
    })

    console.log(`✓ SMS sent to ${to} (SID: ${result.sid})`)
  } catch (error) {
    console.error('✗ SMS send failed:', error)
    throw new Error('Failed to send SMS. Please try again.')
  }
}

/**
 * Send OTP code via Twilio Verify API
 */
export async function sendOTPCode(phoneNumber: string): Promise<void> {
  console.log('[SMS-PROVIDER] sendOTPCode called for:', phoneNumber)

  const client = getTwilioClient()
  console.log('[SMS-PROVIDER] Twilio client initialized')

  const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID
  console.log('[SMS-PROVIDER] Verify Service SID:', verifySid)

  if (!verifySid) {
    console.error('[SMS-PROVIDER] ERROR: Verify Service SID not configured')
    throw new Error('Twilio Verify Service SID not configured. Set TWILIO_VERIFY_SERVICE_SID.')
  }

  try {
    console.log('[SMS-PROVIDER] Creating verification request...')
    console.log('[SMS-PROVIDER] To:', phoneNumber)
    console.log('[SMS-PROVIDER] Service:', verifySid)

    const verification = await client.verify.v2
      .services(verifySid)
      .verifications.create({
        to: phoneNumber,
        channel: 'sms'
      })

    console.log(`[SMS-PROVIDER] ✓ Verification sent to ${phoneNumber}`)
    console.log(`[SMS-PROVIDER] Status: ${verification.status}`)
    console.log(`[SMS-PROVIDER] SID: ${verification.sid}`)
  } catch (error: any) {
    console.error('[SMS-PROVIDER] ✗ Verification send failed')
    console.error('[SMS-PROVIDER] Error name:', error.name)
    console.error('[SMS-PROVIDER] Error message:', error.message)
    console.error('[SMS-PROVIDER] Error code:', error.code)
    console.error('[SMS-PROVIDER] Error status:', error.status)
    console.error('[SMS-PROVIDER] Full error:', error)
    throw new Error('Failed to send verification code. Please try again.')
  }
}

/**
 * Verify OTP code via Twilio Verify API
 */
export async function verifyOTPCode(phoneNumber: string, code: string): Promise<boolean> {
  const client = getTwilioClient()
  const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID

  if (!verifySid) {
    throw new Error('Twilio Verify Service SID not configured. Set TWILIO_VERIFY_SERVICE_SID.')
  }

  try {
    const verificationCheck = await client.verify.v2
      .services(verifySid)
      .verificationChecks.create({
        to: phoneNumber,
        code: code
      })

    console.log(`✓ Verification check for ${phoneNumber}: ${verificationCheck.status}`)

    return verificationCheck.status === 'approved'
  } catch (error) {
    console.error('✗ Verification check failed:', error)
    throw new Error('Invalid verification code.')
  }
}

/**
 * Send friend booking invitation SMS
 */
export async function sendFriendBookingInvite({
  friendPhone,
  requesterName,
  serviceName,
  dateTime,
  confirmUrl
}: {
  friendPhone: string
  requesterName: string
  serviceName: string
  dateTime: string
  confirmUrl: string
}): Promise<void> {
  const message = `Hi! ${requesterName} wants to book you for ${serviceName} at LashPop on ${dateTime}.\n\nConfirm here: ${confirmUrl}\n\n(This will create your LashPop account - takes 30 seconds!)`

  await sendSMS({
    to: friendPhone,
    message
  })
}

/**
 * Send appointment confirmation SMS
 */
export async function sendAppointmentConfirmation({
  phoneNumber,
  serviceName,
  dateTime,
  teamMemberName
}: {
  phoneNumber: string
  serviceName: string
  dateTime: string
  teamMemberName: string
}): Promise<void> {
  const message = `✓ Your appointment is confirmed!\n\n${serviceName} with ${teamMemberName}\n${dateTime}\n\nSee you soon! - LashPop`

  await sendSMS({
    to: phoneNumber,
    message
  })
}

/**
 * Send appointment reminder SMS
 */
export async function sendAppointmentReminder({
  phoneNumber,
  serviceName,
  dateTime,
  teamMemberName
}: {
  phoneNumber: string
  serviceName: string
  dateTime: string
  teamMemberName: string
}): Promise<void> {
  const message = `Reminder: You have an appointment tomorrow!\n\n${serviceName} with ${teamMemberName}\n${dateTime}\n\nWe can't wait to see you! - LashPop`

  await sendSMS({
    to: phoneNumber,
    message
  })
}
