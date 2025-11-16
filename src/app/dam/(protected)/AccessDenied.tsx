"use client"

interface AccessDeniedProps {
  reason?: 'no-access' | 'inactive' | 'session-expired'
}

export function AccessDenied({ reason = 'no-access' }: AccessDeniedProps) {
  const handleReturnHome = () => {
    document.cookie = 'auth_token=; Max-Age=0; path=/'
    window.location.href = '/'
  }

  // Get appropriate content based on the reason
  const content = {
    'no-access': {
      title: 'Access Denied',
      description: "You don't have permission to access the Digital Asset Manager.",
      suggestion: 'Please contact an administrator to request access.',
      icon: (
        <svg className="w-10 h-10 text-terracotta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    'inactive': {
      title: 'Account Inactive',
      description: 'Your account has been deactivated.',
      suggestion: 'Please contact an administrator if you believe this is an error.',
      icon: (
        <svg className="w-10 h-10 text-terracotta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      )
    },
    'session-expired': {
      title: 'Session Expired',
      description: 'Your session has expired for security reasons.',
      suggestion: 'Please log in again to continue.',
      icon: (
        <svg className="w-10 h-10 text-terracotta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  }

  const { title, description, suggestion, icon } = content[reason]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cream via-warm-sand to-dusty-rose/30 px-4">
      <div className="max-w-md w-full text-center space-y-6 glass border border-sage/20 rounded-3xl p-8 shadow-xl">
        <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-gradient-to-br from-terracotta/30 to-dusty-rose/30 backdrop-blur-sm border border-terracotta/20">
          {icon}
        </div>
        <div>
          <h2 className="h2 text-dune mb-3">{title}</h2>
          <p className="body text-dune/60">
            {description}
          </p>
          <p className="mt-4 text-sm text-dune/50">
            {suggestion}
          </p>
        </div>
        <button
          onClick={handleReturnHome}
          className="btn btn-secondary"
        >
          Return Home
        </button>
      </div>
    </div>
  )
}
