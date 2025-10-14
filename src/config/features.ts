const parseBool = (value: string | undefined): boolean => {
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  return ["1", "true", "yes", "on", "enabled"].includes(normalized)
}

export const features = {
  // Explicit flags win; otherwise infer from presence of required keys
  stripe:
    parseBool(process.env.ENABLE_STRIPE) ||
    (!!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_WEBHOOK_SECRET),
  clerk:
    parseBool(process.env.ENABLE_CLERK) ||
    (!!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      !!process.env.CLERK_SECRET_KEY),
  supabase:
    parseBool(process.env.ENABLE_DB || process.env.ENABLE_SUPABASE) ||
    !!process.env.DATABASE_URL
}
