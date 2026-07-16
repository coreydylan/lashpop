'use server'

import { requireAdminRole } from '@/lib/admin/auth'
import { recordAdminAction } from '@/lib/admin/audit'

const MOX_API_URL = process.env.MOX_API_URL || 'https://mox-api.experialstudio.com'
const MOX_API_KEY = process.env.MOX_API_KEY!

const DEVELOPER_EMAIL = 'me@coreydylan.net'
const SENDER_EMAIL = 'noreply@lashpopstudios.com'

interface DesignChange {
  elementLabel: string
  property: string
  value: string
}

interface CustomColor {
  name: string
  hex: string
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character] ?? character)
}

export async function sendDesignChanges(
  changes: DesignChange[],
  customColors: CustomColor[],
  pageUrl: string,
  notes: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await requireAdminRole('owner', 'publisher')
    if (!MOX_API_KEY) throw new Error('Design feedback email is not configured')
    if (!Array.isArray(changes) || changes.length === 0 || changes.length > 100) {
      throw new Error('Submit between 1 and 100 design changes')
    }
    if (!Array.isArray(customColors) || customColors.length > 30) {
      throw new Error('Too many custom colors')
    }

    const safePageUrl = pageUrl.slice(0, 2_000)
    const safeNotes = notes.slice(0, 10_000)
    const subject = `[LashPop] Design Feedback — ${changes.length} change${changes.length !== 1 ? 's' : ''}`

    // Plain text body
    const textLines = [
      'Design Feedback from LashPop Studios',
      '='.repeat(40),
      '',
      `Page: ${safePageUrl}`,
      `Submitted: ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}`,
      '',
    ]

    if (safeNotes.trim()) {
      textLines.push('Notes:', '-'.repeat(20), safeNotes.trim(), '')
    }

    textLines.push('Changes requested:', '-'.repeat(20))
    changes.forEach((c, i) => textLines.push(`${i + 1}. "${c.elementLabel}" — ${c.property} → ${c.value}`))

    if (customColors.length > 0) {
      textLines.push('', 'Custom colors added:', '-'.repeat(20))
      customColors.forEach(c => textLines.push(`- ${c.name}: ${c.hex}`))
    }

    const text = textLines.join('\n')

    // HTML body
    const changesHtml = changes.map(c => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f0e0db; color: #3d3632; font-weight: 500;">${escapeHtml(c.elementLabel.slice(0, 500))}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f0e0db; color: #666;">${escapeHtml(c.property.slice(0, 200))}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f0e0db; color: #b5563d; font-weight: 500;">${escapeHtml(c.value.slice(0, 1_000))}</td>
      </tr>
    `).join('')

    const notesHtml = safeNotes.trim() ? `
      <div style="margin-bottom: 20px; padding: 16px; background: #faf6f2; border-radius: 8px; border-left: 3px solid #cc947f;">
        <div style="font-size: 11px; text-transform: uppercase; color: #999; font-weight: 600; margin-bottom: 6px;">Notes</div>
        <p style="margin: 0; color: #3d3632; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(safeNotes.trim())}</p>
      </div>
    ` : ''

    const customColorsHtml = customColors.length > 0 ? `
      <div style="margin-top: 24px;">
        <h3 style="margin: 0 0 12px 0; color: #3d3632; font-size: 14px; font-weight: 600;">Custom Colors Added</h3>
        <table style="border-collapse: collapse;">
          <tr>
            ${customColors.map(c => `
              <td style="padding: 0 12px 0 0; text-align: center;">
                <div style="width: 48px; height: 48px; border-radius: 8px; background-color: ${/^#[0-9a-fA-F]{6}$/.test(c.hex) ? c.hex : '#ffffff'}; border: 1px solid #e5e5e5; margin-bottom: 4px;"></div>
                <div style="font-size: 11px; color: #666;">${escapeHtml(c.name.slice(0, 100))}</div>
                <div style="font-size: 10px; color: #999; font-family: monospace;">${escapeHtml(c.hex.slice(0, 20))}</div>
              </td>
            `).join('')}
          </tr>
        </table>
      </div>
    ` : ''

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #faf6f2;">
  <div style="max-width: 640px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #b5563d 0%, #cc947f 100%); padding: 28px 30px; border-radius: 12px 12px 0 0;">
      <h1 style="margin: 0; color: white; font-size: 22px; font-weight: 500;">Design Feedback</h1>
      <p style="margin: 6px 0 0 0; color: rgba(255,255,255,0.85); font-size: 13px;">LashPop Studios</p>
    </div>
    <div style="background: white; padding: 28px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
      <div style="margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #f0e0db;">
        <span style="font-size: 12px; color: #999;">Page:</span>
        <span style="font-size: 13px; color: #b5563d; margin-left: 6px;">${escapeHtml(safePageUrl)}</span>
      </div>
      ${notesHtml}
      <h3 style="margin: 0 0 12px 0; color: #3d3632; font-size: 14px; font-weight: 600;">${changes.length} Change${changes.length !== 1 ? 's' : ''} Requested</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <thead>
          <tr style="background: #faf6f2;">
            <th style="padding: 8px 12px; text-align: left; color: #999; font-weight: 500; font-size: 11px; text-transform: uppercase;">Element</th>
            <th style="padding: 8px 12px; text-align: left; color: #999; font-weight: 500; font-size: 11px; text-transform: uppercase;">Property</th>
            <th style="padding: 8px 12px; text-align: left; color: #999; font-weight: 500; font-size: 11px; text-transform: uppercase;">Value</th>
          </tr>
        </thead>
        <tbody>${changesHtml}</tbody>
      </table>
      ${customColorsHtml}
      <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #f0e0db; text-align: center; color: #999; font-size: 11px;">
        Submitted ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}
      </div>
    </div>
  </div>
</body>
</html>`

    await recordAdminAction({
      action: 'design.feedback.send',
      targetType: 'design-feedback',
      targetId: safePageUrl,
      actorUserId: auth.userId,
      diff: { changeCount: changes.length, customColorCount: customColors.length },
    })

    const res = await fetch(`${MOX_API_URL}/api/v1/emails/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MOX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: SENDER_EMAIL,
        to: [DEVELOPER_EMAIL],
        subject,
        text,
        html,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Email API error (${res.status}): ${body}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Error sending design changes email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
}
