import { NextRequest, NextResponse } from 'next/server'
import { syncService, syncTeamMember, syncAllServices, syncAllTeamMembers } from '@/lib/vagaro-sync'

/**
 * Vagaro Webhook Endpoint
 *
 * Receives webhook events from Vagaro and syncs data to local database.
 * Subscribed to: Services, Employees, Appointments, Customers, Locations, Transactions, Form Responses
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('🎣 Vagaro Webhook Received!')
    console.log('📦 Event Type:', body.eventType || body.event)
    console.log('📦 Business ID:', body.businessId)

    const eventType = body.eventType || body.event || ''

    // Process different event types
    if (eventType.includes('service')) {
      // Service created/updated/deleted
      console.log('🔄 Processing service event...')

      if (body.service || body.data?.service) {
        const service = body.service || body.data.service
        await syncService(service)
      } else {
        // If no specific service, sync all services
        await syncAllServices()
      }
    }
    else if (eventType.includes('employee') || eventType.includes('provider')) {
      // Employee/Service Provider created/updated/deleted
      console.log('🔄 Processing employee event...')

      if (body.employee || body.serviceProvider || body.data?.employee) {
        const employee = body.employee || body.serviceProvider || body.data.employee
        await syncTeamMember(employee)
      } else {
        // If no specific employee, sync all employees
        await syncAllTeamMembers()
      }
    }
    else if (eventType.includes('location')) {
      // Location created/updated - might affect services/employees
      console.log('🔄 Location changed, syncing all data...')
      await Promise.all([
        syncAllServices(),
        syncAllTeamMembers()
      ])
    }
    else {
      // For other events (appointment, customer, transaction, form), just log
      console.log('ℹ️ Event logged (no sync action):', eventType)
      if (body.customerId) console.log('  Customer ID:', body.customerId)
      if (body.appointmentId) console.log('  Appointment ID:', body.appointmentId)
    }

    // Return 200 to acknowledge receipt
    return NextResponse.json({
      received: true,
      eventType,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
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
