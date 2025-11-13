/**
 * Login Page
 *
 * Phone-based authentication entry point
 */

import { PhoneLoginForm } from '@/components/auth/PhoneLoginForm'

export const metadata = {
  title: 'Sign In | LashPop',
  description: 'Sign in to your LashPop account'
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            LashPop
          </h1>
          <p className="text-gray-600">
            Beautiful lashes, effortless booking
          </p>
        </div>

        <PhoneLoginForm />
      </div>
    </div>
  )
}
