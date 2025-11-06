'use client'

import { useEffect } from 'react'

interface VagaroBookingWidgetProps {
  businessId?: string
  employeeId?: string
  serviceId?: string
  className?: string
}

/**
 * Vagaro Booking Widget Integration
 *
 * Embeds the Vagaro booking widget for handling appointments and payments.
 * This provides a seamless booking experience while leveraging Vagaro's
 * availability management and payment processing.
 */
export function VagaroBookingWidget({
  businessId,
  employeeId,
  serviceId,
  className = '',
}: VagaroBookingWidgetProps) {
  const widgetUrl = process.env.NEXT_PUBLIC_VAGARO_WIDGET_URL || 'https://www.vagaro.com/bookingwidget'

  useEffect(() => {
    // Load Vagaro widget script if not already loaded
    if (typeof window !== 'undefined' && !(window as any).VagaroWidget) {
      const script = document.createElement('script')
      script.src = `${widgetUrl}/widget.js`
      script.async = true
      document.body.appendChild(script)

      return () => {
        document.body.removeChild(script)
      }
    }
  }, [widgetUrl])

  // Build widget URL with parameters
  const getWidgetUrl = () => {
    const params = new URLSearchParams()

    if (businessId) params.append('bid', businessId)
    if (employeeId) params.append('eid', employeeId)
    if (serviceId) params.append('sid', serviceId)

    const queryString = params.toString()
    return queryString ? `${widgetUrl}?${queryString}` : widgetUrl
  }

  return (
    <div className={`vagaro-widget-container ${className}`}>
      <iframe
        src={getWidgetUrl()}
        width="100%"
        height="600"
        frameBorder="0"
        title="Book Appointment"
        className="rounded-lg shadow-lg"
      />
    </div>
  )
}

/**
 * Opens Vagaro booking widget in a new window
 */
export function openVagaroBooking({
  url,
  employeeId,
  serviceId,
}: {
  url: string
  employeeId?: string
  serviceId?: string
}) {
  const params = new URLSearchParams()
  if (employeeId) params.append('eid', employeeId)
  if (serviceId) params.append('sid', serviceId)

  const queryString = params.toString()
  const bookingUrl = queryString ? `${url}?${queryString}` : url

  window.open(bookingUrl, '_blank', 'width=800,height=800')
}
