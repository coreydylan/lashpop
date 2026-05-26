import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function NoAccessPage() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <h1 className="font-serif text-3xl text-dune mb-4">Access required</h1>
        <p className="text-dune/70 mb-8 leading-relaxed">
          You&apos;re signed in, but your account doesn&apos;t have admin access yet.
          Ask Emily or another studio admin to add you in <span className="font-mono text-sm">/admin/system/users</span>.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 rounded-full border border-terracotta text-terracotta hover:bg-terracotta hover:text-cream transition-colors"
        >
          Back to lashpop.com
        </Link>
      </div>
    </div>
  )
}
