import { NextRequest, NextResponse } from 'next/server'

// Email templates
const EMAIL_TEMPLATES = {
  inquiry: {
    subject: 'New Inquiry via ASK LASHPOP',
    prefix: 'A customer submitted an inquiry through the ASK LASHPOP chat:',
  },
  bridal: {
    subject: '💒 Bridal Inquiry via ASK LASHPOP',
    prefix: 'A bride-to-be reached out through ASK LASHPOP:',
  },
  complaint: {
    subject: '⚠️ Customer Feedback via ASK LASHPOP',
    prefix: 'A customer shared feedback that needs attention:',
  },
  general: {
    subject: 'Contact Request via ASK LASHPOP',
    prefix: 'A customer wants to get in touch:',
  },
  callback: {
    subject: 'Callback Request via ASK LASHPOP',
    prefix: 'A customer requested a callback:',
  },
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { template, contactInfo, additionalData, conversationSummary } = body

    if (!contactInfo?.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const emailTemplate = EMAIL_TEMPLATES[template as keyof typeof EMAIL_TEMPLATES] || EMAIL_TEMPLATES.general

    // Build email body
    const emailBody = buildEmailBody({
      template: emailTemplate,
      contactInfo,
      additionalData,
      conversationSummary,
    })

    // For now, log the email (you'll want to integrate with your email service)
    console.log('=== ASK LASHPOP EMAIL ===')
    console.log('To: hello@lashpopstudios.com')
    console.log('Subject:', emailTemplate.subject)
    console.log('Body:', emailBody)
    console.log('========================')

    // TODO: Integrate with your email service
    // Options:
    // 1. Resend (resend.com) - Simple API
    // 2. SendGrid
    // 3. AWS SES
    // 4. Nodemailer with SMTP

    // Example with Resend (uncomment when ready):
    /*
    const resend = new Resend(process.env.RESEND_API_KEY)

    await resend.emails.send({
      from: 'ASK LASHPOP <noreply@lashpopstudios.com>',
      to: 'hello@lashpopstudios.com',
      replyTo: contactInfo.email,
      subject: emailTemplate.subject,
      html: emailBody,
    })
    */

    // TODO: Send SMS notification via Twilio
    // You already have Twilio installed, so you can add:
    /*
    const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

    await twilio.messages.create({
      body: `New ${template} inquiry from ${contactInfo.name || contactInfo.email} via ASK LASHPOP`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: process.env.LASHPOP_NOTIFICATION_PHONE,
    })
    */

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('ASK LASHPOP email error:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}

function buildEmailBody({
  template,
  contactInfo,
  additionalData,
  conversationSummary,
}: {
  template: { subject: string; prefix: string }
  contactInfo: { email: string; phone?: string; name?: string }
  additionalData?: Record<string, string>
  conversationSummary?: string
}): string {
  const sections: string[] = []

  // Header
  sections.push(`<h2 style="color: #8A5E55; margin-bottom: 16px;">${template.prefix}</h2>`)

  // Contact Info
  sections.push(`
    <div style="background: #FAF7F1; padding: 16px; border-radius: 12px; margin-bottom: 16px;">
      <h3 style="color: #8A7C69; margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Contact Information</h3>
      ${contactInfo.name ? `<p style="margin: 4px 0;"><strong>Name:</strong> ${contactInfo.name}</p>` : ''}
      <p style="margin: 4px 0;"><strong>Email:</strong> <a href="mailto:${contactInfo.email}">${contactInfo.email}</a></p>
      ${contactInfo.phone ? `<p style="margin: 4px 0;"><strong>Phone:</strong> <a href="tel:${contactInfo.phone}">${contactInfo.phone}</a></p>` : ''}
    </div>
  `)

  // Additional Data (wedding date, message, etc.)
  if (additionalData && Object.keys(additionalData).length > 0) {
    const dataFields = Object.entries(additionalData)
      .filter(([key]) => !['name', 'email', 'phone'].includes(key))
      .map(([key, value]) => {
        const label = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase())
          .replace('_', ' ')
        return `<p style="margin: 4px 0;"><strong>${label}:</strong> ${value}</p>`
      })
      .join('')

    if (dataFields) {
      sections.push(`
        <div style="background: #FAF7F1; padding: 16px; border-radius: 12px; margin-bottom: 16px;">
          <h3 style="color: #8A7C69; margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Details</h3>
          ${dataFields}
        </div>
      `)
    }
  }

  // Conversation Summary
  if (conversationSummary) {
    sections.push(`
      <div style="background: #F5F0E8; padding: 16px; border-radius: 12px; margin-bottom: 16px;">
        <h3 style="color: #8A7C69; margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Conversation with AI Concierge</h3>
        <pre style="white-space: pre-wrap; font-family: inherit; font-size: 14px; color: #5A5045; margin: 0;">${conversationSummary}</pre>
      </div>
    `)
  }

  // Footer
  sections.push(`
    <hr style="border: none; border-top: 1px solid #E5DDD4; margin: 24px 0;" />
    <p style="color: #8A7C69; font-size: 12px;">
      This message was sent via the ASK LASHPOP AI concierge on your website.
    </p>
  `)

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #5A5045;">
      ${sections.join('')}
    </div>
  `
}
