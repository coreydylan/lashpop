/**
 * SMS Provider - Twilio Verify API
 *
 * Handles OTP verification via Twilio Verify and other SMS messages
 */

import twilio from 'twilio'

// Initialize Twilio client (lazy loaded)
let twilioClient: ReturnType<typeof twilio> | null = null

function getTwilioClient() {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN

    if (!accountSid || !authToken) {
      console.error('[sms] Twilio credentials are not configured')
      throw new Error('Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.')
    }

    twilioClient = twilio(accountSid, authToken)
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
    await client.messages.create({
      body: message,
      from: fromNumber,
      to: to
    })
  } catch (error: unknown) {
    console.error('[sms] Message delivery failed', error instanceof Error ? error.name : 'UnknownError')
    throw new Error('Failed to send SMS. Please try again.')
  }
}

/**
 * Send OTP code via Twilio Verify API
 */
export async function sendOTPCode(phoneNumber: string): Promise<void> {
  const client = getTwilioClient()

  const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID

  if (!verifySid) {
    console.error('[sms] Twilio Verify service is not configured')
    throw new Error('Twilio Verify Service SID not configured. Set TWILIO_VERIFY_SERVICE_SID.')
  }

  try {
    await client.verify.v2
      .services(verifySid)
      .verifications.create({
        to: phoneNumber,
        channel: 'sms'
      })
  } catch (error: unknown) {
    console.error('[sms] Verification delivery failed', error instanceof Error ? error.name : 'UnknownError')
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

    return verificationCheck.status === 'approved'
  } catch (error: unknown) {
    console.error('[sms] Verification check failed', error instanceof Error ? error.name : 'UnknownError')
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
