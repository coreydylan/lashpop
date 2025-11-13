/**
 * Phone Number Utilities
 *
 * Format and validate phone numbers
 */

/**
 * Format phone number for display (US format)
 * Example: 5551234567 → (555) 123-4567
 */
export function formatPhoneNumber(value: string): string {
  // Remove all non-digits
  const phoneNumber = value.replace(/\D/g, '')

  // Limit to 10 digits
  const limitedNumber = phoneNumber.slice(0, 10)

  // Format: (XXX) XXX-XXXX
  if (limitedNumber.length >= 6) {
    return `(${limitedNumber.slice(0, 3)}) ${limitedNumber.slice(3, 6)}-${limitedNumber.slice(6)}`
  } else if (limitedNumber.length >= 3) {
    return `(${limitedNumber.slice(0, 3)}) ${limitedNumber.slice(3)}`
  } else if (limitedNumber.length > 0) {
    return `(${limitedNumber}`
  }

  return ''
}

/**
 * Convert formatted phone to E.164 format for Twilio
 * Example: (555) 123-4567 → +15551234567
 */
export function toE164(phoneNumber: string, countryCode: string = '+1'): string {
  const digits = phoneNumber.replace(/\D/g, '')
  return `${countryCode}${digits}`
}

/**
 * Validate US phone number
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  const digits = phoneNumber.replace(/\D/g, '')
  return digits.length === 10
}

/**
 * Parse phone number from various formats to consistent format
 */
export function parsePhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '')

  // If starts with 1, assume it's +1 (US)
  if (digits.length === 11 && digits[0] === '1') {
    return toE164(digits.slice(1))
  }

  // If 10 digits, assume US
  if (digits.length === 10) {
    return toE164(digits)
  }

  // Otherwise, just prepend +1
  return `+1${digits}`
}
