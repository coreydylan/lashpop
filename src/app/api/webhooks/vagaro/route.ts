import { NextRequest, NextResponse } from 'next/server'
import { syncService, syncTeamMember, syncAllServices, syncAllTeamMembers } from '@/lib/vagaro-sync'
import {
  syncAppointment,
  syncCustomer,
  syncBusinessLocation,
  syncFormResponse,
  syncTransaction
} from '@/lib/vagaro-sync-all'
import { autoLinkAppointmentByPhone } from '@/actions/appointments'

/**
 * Vagaro Webhook Endpoint
 *
 * Receives ALL webhook events from Vagaro and syncs to local database mirror.
 * Subscribed to: Appointments, Customers, Employees, Business Locations, Form Responses, Transactions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const eventType = (body.type || body.eventType || '').toLowerCase()
    const action = (body.action || '').toLowerCase()
    const payload = body.payload || body

    console.log(`🎣 Vagaro Webhook: ${eventType} - ${action}`)

    // Route to appropriate sync function based on event type
    switch (eventType) {
      case 'appointment':
        console.log('📅 Syncing appointment...')
        await syncAppointment(payload)

        // Auto-link appointment to LashPop user by phone number
        if (payload.appointmentId) {
          try {
            console.log('🔗 Attempting to auto-link appointment to user...')
            await autoLinkAppointmentByPhone(payload.appointmentId)
          } catch (error) {
            console.error('  ⚠️ Failed to auto-link appointment:', error)
            // Continue even if auto-link fails
          }
        }
        break

      case 'customer':
        console.log('👤 Syncing customer...')
        await syncCustomer(payload)
        break

      case 'employee':
        console.log('👨‍💼 Syncing employee...')
        await syncTeamMember(payload)
        break

      case 'business_location':
      case 'location':
        console.log('🏢 Syncing business location...')
        await syncBusinessLocation(payload)
        // Location changes might affect services/employees
        if (action === 'updated' || action === 'created') {
          console.log('  Triggering full service/employee sync...')
          await Promise.all([
            syncAllServices(),
            syncAllTeamMembers()
          ])
        }
        break

      case 'formresponse':
      case 'form_response':
        console.log('📋 Syncing form response...')
        await syncFormResponse(payload)
        break

      case 'transaction':
        console.log('💰 Syncing transaction...')
        await syncTransaction(payload)
        break

      default:
        // Log unknown event types for future handling
        console.log(`ℹ️ Unknown event type: ${eventType}`)
        console.log('   Payload:', JSON.stringify(payload, null, 2))
    }

    // Return 200 to acknowledge receipt
    return NextResponse.json({
      received: true,
      eventType,
      action,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Webhook error:', error)
    // Still return 200 to prevent retries for non-recoverable errors
    return NextResponse.json(
      {
        received: true,
        error: 'Processing failed but acknowledged',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 200 } // Return 200 to prevent Vagaro from retrying
    )
  }
}

// Also handle GET for webhook verification
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'Vagaro webhook endpoint is active',
    timestamp: new Date().toISOString()
  })
}
