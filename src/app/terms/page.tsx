import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | LashPop Studios',
  description: 'LashPop Studios Terms of Service governing access to and use of our website and services.',
  alternates: { canonical: 'https://lashpopstudios.com/terms' },
  openGraph: {
    title: 'Terms of Service | LashPop Studios',
    description: 'Terms governing access to and use of the LashPop Studios website and services.',
    url: 'https://lashpopstudios.com/terms',
    type: 'website',
  },
}

export default function TermsOfServicePage() {
  return (
    <main className="bg-ivory min-h-screen pt-24 pb-16">
      <div className="container max-w-3xl mx-auto px-6">
        <h1 className="text-3xl md:text-4xl font-display font-semibold text-charcoal mb-2">
          Terms of Service
        </h1>
        <p className="text-sm text-charcoal/60 mb-10">Effective Date: February 7, 2026</p>

        <div className="prose prose-sm max-w-none text-charcoal/90 space-y-6 [&_h2]:text-xl [&_h2]:font-display [&_h2]:font-medium [&_h2]:text-charcoal [&_h2]:mt-10 [&_h2]:mb-3 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-charcoal [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:leading-relaxed [&_ul]:space-y-1 [&_li]:leading-relaxed">
          <p>
            These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the LashPop Studios website and any related services, content, bookings, and communications (collectively, the &ldquo;Services&rdquo;). By using our Services, you agree to these Terms.
          </p>
          <p>If you do not agree, do not use the Services.</p>

          <h2>1) Who We Are</h2>
          <p>
            LashPop Studios (&ldquo;LashPop,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is a beauty collective that hosts independent, self-employed beauty professionals. Because professionals operate independently, hours, pricing, services, policies, and forms of payment may vary, and you may need to contact your stylist directly regarding appointments or questions.
          </p>

          <h2>2) Eligibility</h2>
          <p>
            You must be at least 18 years old (or the age of majority in your jurisdiction) to book services or make purchases through our Services.
          </p>

          <h2>3) Bookings, Services, and Studio Policies</h2>

          <h3>A. Booking requests and confirmations</h3>
          <p>
            Appointments may be requested online and/or through third-party booking platforms. Availability is not guaranteed until confirmed.
          </p>

          <h3>B. Independent professional policies</h3>
          <p>
            Because professionals are independent, their specific policies (including deposits, no-show rules, reschedules, and payment methods) may differ. You are responsible for reviewing and complying with your stylist&apos;s policies.
          </p>

          <h3>C. Cancellation / rescheduling policy (LashPop baseline)</h3>
          <p>Unless your stylist provides a different written policy, LashPop&apos;s baseline policy is:</p>
          <ul>
            <li>24-hour notice is required for cancellations or appointment change requests.</li>
            <li>Cancellations within 24 hours may be charged 50% of the quoted cost of the appointment.</li>
          </ul>

          <h3>D. Late arrivals</h3>
          <p>
            Clients more than 15 minutes late may receive a shortened service at the same cost due to scheduling constraints.
          </p>

          <h2>4) Payments, Fees, and Refunds</h2>
          <p>
            Prices may be displayed online or provided at booking, but final pricing may depend on the service, stylist, and conditions discussed during your appointment.
          </p>
          <p>
            If you purchase products, gift cards, or other items through the Services, you agree to pay all charges, taxes, and shipping fees (if applicable).
          </p>
          <p>
            Refunds and exchanges (if any) are handled according to the policies of the selling entity (LashPop Studios or the independent professional, as applicable).
          </p>

          <h2>5) Third-Party Booking Platforms and Links</h2>
          <p>
            We may use third-party tools for booking, payments, reviews, or communications (for example, Vagaro). Your use of those services is also governed by their terms and policies, and we are not responsible for third-party platforms.
          </p>

          <h2>6) Health, Safety, and Client Responsibilities</h2>
          <p>You agree to:</p>
          <ul>
            <li>Provide accurate information when booking (name, contact info, relevant notes).</li>
            <li>Disclose relevant sensitivities, allergies, or medical considerations to your provider before services begin.</li>
            <li>Follow aftercare instructions and studio/professional guidance.</li>
            <li>Behave respectfully toward staff, independent professionals, and other clients.</li>
          </ul>
          <p>We may refuse or end service for safety, harassment, threats, or disruptive behavior.</p>

          <h2>7) Website Use and Acceptable Conduct</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Services for unlawful purposes.</li>
            <li>Attempt to access or interfere with systems, accounts, or data you do not have permission to use.</li>
            <li>Scrape, copy, or reuse site content in a way that violates these Terms or applicable laws.</li>
            <li>Post or transmit harmful, abusive, or misleading content through forms, messages, reviews, or other channels.</li>
          </ul>

          <h2>8) Intellectual Property</h2>
          <p>
            All site content (text, logos, graphics, photos, and design) is owned by LashPop or its licensors and is protected by intellectual property laws. You may not use it without written permission, except for personal, non-commercial use of the Services.
          </p>

          <h2>9) Disclaimers</h2>
          <p>
            The Services are provided &ldquo;as is&rdquo; and &ldquo;as available.&rdquo;
          </p>
          <p>
            LashPop does not guarantee uninterrupted access to the website or that information will always be current or error-free.
          </p>
          <p>
            Beauty services have inherent variability in results. We do not guarantee specific outcomes.
          </p>

          <h2>10) Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, LashPop and its owners, employees, contractors, and agents will not be liable for indirect, incidental, special, consequential, or punitive damages, or any loss of profits or data, arising from your use of the Services.
          </p>
          <p>
            If liability is found, LashPop&apos;s total liability for any claim will not exceed the amount you paid LashPop (if any) for the applicable Service giving rise to the claim.
          </p>

          <h2>11) Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless LashPop from claims, damages, liabilities, and expenses (including reasonable attorneys&apos; fees) arising out of your use of the Services, your violation of these Terms, or your violation of any law or third-party right.
          </p>

          <h2>12) Privacy</h2>
          <p>
            Your use of the Services is also governed by our <a href="/privacy" className="text-terracotta hover:underline">Privacy Policy</a>.
          </p>

          <h2>13) Changes to the Services or These Terms</h2>
          <p>
            We may update the Services or these Terms from time to time. The &ldquo;Effective Date&rdquo; will reflect the latest version. Continued use after changes means you accept the updated Terms.
          </p>

          <h2>14) Governing Law</h2>
          <p>
            These Terms are governed by the laws of the State of California, without regard to conflict-of-law principles.
          </p>

          <h2>15) Contact</h2>
          <p>
            Questions about these Terms can be directed to LashPop Studios via the contact methods listed on our website.
          </p>
        </div>
      </div>
    </main>
  )
}
