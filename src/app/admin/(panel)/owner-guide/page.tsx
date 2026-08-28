import type { Metadata } from "next"
import { Suspense } from "react"
import { AdminOwnerGuide } from "@/components/admin-guide/AdminOwnerGuide"

export const metadata: Metadata = {
  title: "Owner guide — LashPop Admin",
  description: "Plain-language help for every LashPop Admin task.",
}

export default function OwnerGuidePage() {
  return (
    <Suspense fallback={<div className="min-h-64 animate-pulse rounded-xl bg-white" aria-label="Loading Owner guide" />}>
      <AdminOwnerGuide />
    </Suspense>
  )
}
