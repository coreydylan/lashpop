'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function subscribeToNewsletter(email: string) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const { error } = await supabase
    .from('newsletter_subscriptions')
    .insert({ email, source: 'footer_form' })

  if (error) {
    if (error.code === '23505') {
      // Unique constraint violation - email already exists
      return { success: true, message: 'Already subscribed!' }
    }
    console.error('Newsletter subscription error:', error)
    return { success: false, message: 'Subscription failed. Please try again.' }
  }

  return { success: true, message: 'Subscribed!' }
}
