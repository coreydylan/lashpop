'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function subscribeToNewsletter(email: string) {
  const trimmed = email.trim().toLowerCase()
  if (!trimmed || !EMAIL_RE.test(trimmed)) {
    return { success: false, message: 'Please enter a valid email.' }
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const { error } = await supabase
    .from('newsletter_subscriptions')
    .insert({ email: trimmed, source: 'footer_form' })

  if (error) {
    if (error.code === '23505') {
      // Unique constraint violation — already on the list, still count as a win.
      return { success: true, message: 'Thank you — you’re already on the list!' }
    }
    console.error('Newsletter subscription error:', error)
    return { success: false, message: 'Subscription failed. Please try again.' }
  }

  return { success: true, message: 'Thank you — see you in your inbox!' }
}
