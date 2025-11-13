"use client"

export function AccessDenied() {
  const handleReturnHome = () => {
    document.cookie = 'auth_token=; Max-Age=0; path=/'
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cream via-warm-sand to-dusty-rose/30 px-4">
      <div className="max-w-md w-full text-center space-y-6 glass border border-sage/20 rounded-3xl p-8 shadow-xl">
        <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-gradient-to-br from-terracotta/30 to-dusty-rose/30 backdrop-blur-sm border border-terracotta/20">
          <svg className="w-10 h-10 text-terracotta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h2 className="h2 text-dune mb-3">Access Denied</h2>
          <p className="body text-dune/60">
            You don't have permission to access the Digital Asset Manager.
          </p>
          <p className="mt-4 text-sm text-dune/50">
            Please contact an administrator to request access.
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
