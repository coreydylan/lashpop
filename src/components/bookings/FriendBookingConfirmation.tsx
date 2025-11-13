/**
 * Friend Booking Confirmation Component
 *
 * Shows booking details and handles acceptance/decline
 */

'use client'

import { useState } from 'react'
import { PhoneLoginForm } from '@/components/auth/PhoneLoginForm'
import { usePhoneAuth } from '@/lib/auth-client'

export function FriendBookingConfirmation({
  request,
  service,
  teamMember
}: {
  request: any
  service: any
  teamMember: any
}) {
  const { isAuthenticated, user } = usePhoneAuth()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')

  const handleAccept = async () => {
    setIsProcessing(true)
    setError('')

    try {
      const response = await fetch(`/api/bookings/friend/${request.consentToken}/accept`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to confirm booking')
      }

      // Success! Redirect to appointment confirmation
      window.location.href = '/appointments'
    } catch (err: any) {
      setError(err.message || 'Failed to confirm booking')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDecline = async () => {
    if (!confirm('Are you sure you want to decline this booking?')) {
      return
    }

    setIsProcessing(true)
    setError('')

    try {
      const response = await fetch(`/api/bookings/friend/${request.consentToken}/decline`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to decline booking')
      }

      // Show decline confirmation
      alert('Booking declined. Your friend has been notified.')
      window.location.href = '/'
    } catch (err: any) {
      setError(err.message || 'Failed to decline booking')
    } finally {
      setIsProcessing(false)
    }
  }

  // If not authenticated, show phone login first
  if (!isAuthenticated) {
    return (
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">You&apos;ve been invited!</h2>
          <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700">
              <strong>{request.requesterPhone}</strong> wants to book you for:
            </p>
            <p className="text-lg font-semibold text-pink-600 mt-2">
              {service?.name || 'Lash Service'}
            </p>
            {teamMember && (
              <p className="text-sm text-gray-600 mt-1">
                with {teamMember.name}
              </p>
            )}
            {request.requestedDateTime && (
              <p className="text-sm text-gray-600 mt-1">
                {new Date(request.requestedDateTime).toLocaleString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </p>
            )}
          </div>
          <p className="text-sm text-gray-600">
            First, verify your phone number to continue
          </p>
        </div>

        <PhoneLoginForm />
      </div>
    )
  }

  // User is authenticated, show confirmation UI
  return (
    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">💅</div>
        <h1 className="text-2xl font-bold mb-2">Confirm Your Appointment</h1>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-500 uppercase">Service</p>
            <p className="text-lg font-semibold">{service?.name || 'Lash Service'}</p>
          </div>

          {teamMember && (
            <div>
              <p className="text-xs text-gray-500 uppercase">Lash Artist</p>
              <p className="text-lg font-semibold">{teamMember.name}</p>
            </div>
          )}

          {request.requestedDateTime && (
            <div>
              <p className="text-xs text-gray-500 uppercase">Date & Time</p>
              <p className="text-lg font-semibold">
                {new Date(request.requestedDateTime).toLocaleString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p className="text-gray-600">
                {new Date(request.requestedDateTime).toLocaleString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </p>
            </div>
          )}

          {service?.price && (
            <div>
              <p className="text-xs text-gray-500 uppercase">Price</p>
              <p className="text-lg font-semibold">${service.price}</p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={handleAccept}
          disabled={isProcessing}
          className="w-full bg-pink-600 text-white py-3 rounded-lg font-medium hover:bg-pink-700 disabled:opacity-50 transition-colors"
        >
          {isProcessing ? 'Confirming...' : 'Confirm Appointment'}
        </button>

        <button
          onClick={handleDecline}
          disabled={isProcessing}
          className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
        >
          Decline
        </button>
      </div>

      <p className="mt-4 text-xs text-gray-500 text-center">
        By confirming, you agree to LashPop&apos;s cancellation policy
      </p>
    </div>
  )
}
