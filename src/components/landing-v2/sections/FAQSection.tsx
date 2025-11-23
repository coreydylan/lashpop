'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'framer-motion'

// Define FAQ categories and items
type FAQCategory = 'Booking & Appointments' | 'Policies' | 'Services' | 'Lash Extensions' | 'Lash Lifts & Tints' | 'Brows' | 'Microblading & PMU' | 'Botox & Injectables' | 'Facials' | 'Permanent Jewelry' | 'Waxing'

const categories: FAQCategory[] = [
  'Booking & Appointments',
  'Policies',
  'Services',
  'Lash Extensions',
  'Lash Lifts & Tints',
  'Brows',
  'Microblading & PMU',
  'Botox & Injectables',
  'Facials',
  'Permanent Jewelry',
  'Waxing'
]

const faqData: Record<string, Array<{ question: string; answer: React.ReactNode }>> = {
  'Booking & Appointments': [
    {
      question: "How do I book an appointment?",
      answer: "You can easily book through online on our “Book + Contact” page. Simply select your preferred service, choose your artist (or let us match you with someone!), and pick your date/time. You’ll receive a confirmation email and/or text once your appointment is approved /accepted."
    },
    {
      question: "How do I know which service to book?",
      answer: (
        <>
          <p className="mb-2">Not sure which lash style fits you? Take our “lash quiz” on the homepage to find your perfect lash style.</p>
          <p>For brows, facials, Botox, permanent jewelry, or waxing, browse our “Meet the Team” page to find your ideal provider, or call/text the LashPop line and we’ll match you with service provider we think would be the best fit for you.</p>
        </>
      )
    },
    {
      question: "Independent stylists vs. employees — what’s the difference?",
      answer: (
        <>
          <p className="mb-2">We’re a hybrid salon, meaning we have both LashPop employees and independent beauty businesses renting space under our roof. Each independent service provider sets their own pricing/ policies and handles their own bookings and client relationships.</p>
          <p className="mb-2">Each team member has been carefully hand selected to be under the LashPop brand, so either way, you’ll be in great hands whether you book with an employee or independent artist.</p>
          <p>When you book with a specific stylist, your deposit, rescheduling, and cancellation policies follow their terms, though we aim for consistency in standards across all stylists.</p>
        </>
      )
    },
    {
      question: "How to Prepare for Your Appointment",
      answer: (
        <ul className="list-disc pl-5 space-y-1">
          <li>Use the restroom before your appointment.</li>
          <li>Bring headphones or your own playlist if you want to zone out and relax.</li>
          <li>Bring a sweater or light blanket — we keep our studio at 70–72°F for certain products.</li>
          <li>Plan to lay fairly still throughout the service.</li>
          <li>Try to minimize talking during lash services to avoid fluttering eyes or movement that can affect application.</li>
        </ul>
      )
    },
    {
      question: "Parking & Studio Entry / Door Code",
      answer: (
        <>
          <p className="mb-2"><strong>Parking:</strong> Free street parking is available all around near the studio. There is also a shared parking lot on the north end of our building</p>
          <p className="mb-2"><strong>Why we use a door code:</strong> This helps us create a peaceful, uninterrupted environment for your service and ensures that only scheduled clients and team members have access to the studio. It’s simply an extra layer of comfort and safety for both our guests and our team — while keeping out unexpected solicitors or walk-ins. :)</p>
          <p className="mb-2">Please arrive a few minutes early so you can enter smoothly — if the door is locked, call/text the studio number and your stylist will let you in.</p>
          <p>Once you arrive, you can make yourself at home in our waiting area. Please have a seat, grab a tea or coffee, and wait for your stylist to come out and get you.</p>
        </>
      )
    }
  ],
  'Policies': [
    {
      question: "LashPop Studio policies: Children & Pets",
      answer: (
        <ul className="list-disc pl-5 space-y-1">
          <li>To maintain a peaceful, clean environment and ensure safety, we ask that you do not bring children under 10 or pets to your appointment.</li>
          <li>If you do bring a guest, we ask that they just be mindful of our peaceful atmosphere. :)</li>
        </ul>
      )
    },
    {
      question: "Cell Phones & Courtesy",
      answer: (
        <ul className="list-disc pl-5 space-y-1">
          <li>During your service, we ask that you silence your phone to help keep our shared space a peaceful atmosphere for other guests.</li>
          <li>We try to keep conversation at a soft level to allow for others to relax.</li>
        </ul>
      )
    },
    {
      question: "Policies for our Independent LP team members",
      answer: "Each of our independent beauty businesses determine their own policies regarding deposits, payment, cancellation fees, late policies, refunds, etc. Check with your specific service provider to confirm their policies regarding your appointment if you have any questions."
    },
    {
      question: "Referral Program & Discounts",
      answer: (
        <>
          <p className="mb-2">Receive $25 off with any LashPop employee if you refer a friend. Your friend will also receive $25 off their first appointment. It must be used with that specific LashPop employee.</p>
          <p>Because our team is made up of independent stylists, each artist chooses their own client pricing, and promotions. You can always check with your service provider about any referral programs or promos.</p>
        </>
      )
    }
  ],
  'Lash Extensions': [
    {
      question: "Appointment Lengths",
      answer: (
        <ul className="list-disc pl-5 space-y-1">
          <li>Classic Full Set: 1.5-2 hours</li>
          <li>Classic Fill: 60-75 mins</li>
          <li>Mini Fill: 30 min</li>
          <li>Hybrid Full Set: 1.5-2 hours</li>
          <li>Hybrid Fill: 60-75 mins</li>
          <li>Mini Fill: 30-45 min</li>
          <li>Volume Full Set: 2 hrs</li>
          <li>Volume Fill: 1 hr 30 min</li>
          <li>Mini Fill: 30-45 min</li>
          <li>Removal: 30–45 min</li>
        </ul>
      )
    },
    {
      question: "How to Prepare",
      answer: (
        <ul className="list-disc pl-5 space-y-1">
          <li>Arrive with clean, makeup-free lashes.</li>
          <li>Silence your phone.</li>
          <li>Keep talking to a minimum to avoid eye movement during application.</li>
          <li>Use the restroom before your appointment if needed.</li>
          <li>Bring headphones and your phone if you’d like to listen to your own music or podcasts.</li>
          <li>Bring a blanket or sweater — we keep our studio at 70-72 degrees for certain products.</li>
        </ul>
      )
    },
    {
      question: "Aftercare & Maintenance",
      answer: (
        <ul className="list-disc pl-5 space-y-1">
          <li>Clean lashes daily with a lash cleanser and gentle fluffy cleanser brush</li>
          <li>Gently brush with a clean lash brush.</li>
          <li>No mascara, eyeliner, or oil-based products on the lashes.</li>
          <li>Do not use eyelash curlers or water proof makeup around the lashes</li>
          <li>Avoid rubbing, pulling, picking</li>
          <li>Fills every 2–3 weeks are recommended</li>
        </ul>
      )
    },
    {
      question: "Will lash extensions damage my natural lashes?",
      answer: (
        <>
          <p className="mb-2">Damage only happens if they are done incorrectly (we’ve got you covered here), or do not care for them properly (pulling at them, rubbing your eyes, sleeping on your face, not keeping them clean).</p>
          <p>We are committed to best practices in application, to insure healthy lashes for our clients! So as long as you are committed to following the simple aftercare instructions, you’ll be good. 😊</p>
        </>
      )
    },
    {
      question: "How often do I need to come in for fills/touchups?",
      answer: "Fills are recommended every 2-3 weeks."
    },
    {
      question: "Why is it important to come in every 2-3 weeks for fills/touchups?",
      answer: (
        <>
          <p className="mb-2">Your natural lashes follow a shedding cycle of about 6–8 weeks, with each lash growing, shedding, and being replaced by a new one. On average, we naturally shed 2–5 lashes per eye per day. Over the course of a couple of weeks, that adds up to quite a few!</p>
          <p className="mb-1">Regular fills help to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Maintain a full, fluffy look:</strong> As your natural lashes shed, extensions shed with them. A fill replaces what’s grown out or fallen off so your lash line stays full and balanced.</li>
            <li><strong>Keep your lashes healthy:</strong> Grown-out extensions can twist, tangle, or add extra weight on your natural lashes. Removing those and replacing with fresh extensions prevents damage and keeps your natural lashes strong.</li>
          </ul>
        </>
      )
    },
    {
      question: "Can I have an allergic reaction to lash extensions?",
      answer: (
        <>
          <p className="mb-2">Unfortunately reactions can happen if you are allergic to any ingredients in the lash glue. However, we do have a sensitive glue option as an alternative.</p>
          <p>We can always do a “mini” appointment for new clients to test if you are allergic before doing the full set.</p>
        </>
      )
    }
  ],
  'Lash Lifts & Tints': [
    {
      question: "Appointment Length",
      answer: "Lash Lift & Tint: 60-75 mins."
    },
    {
      question: "How to Prepare",
      answer: (
        <ul className="list-disc pl-5 space-y-1">
          <li>Arrive with clean, makeup-free eyes.</li>
          <li>Remove contacts if you wear them.</li>
        </ul>
      )
    },
    {
      question: "Aftercare & Maintenance",
      answer: (
        <ul className="list-disc pl-5 space-y-1">
          <li>Avoid water, steam, and makeup on lashes for 24–48 hours.</li>
          <li>Use nourishing serums if desired.</li>
          <li>Book this service 6-8 weeks apart to avoid over-processing.</li>
        </ul>
      )
    },
    {
      question: "Will lash lifts damage my natural lashes?",
      answer: "When done professionally, lash lifts are gentle and safe."
    }
  ],
  'Brows': [
    {
      question: "Appointment Lengths",
      answer: (
        <ul className="list-disc pl-5 space-y-1">
          <li>Brow Lamination + Tint: 45-60 mins.</li>
          <li>Brow lamination: 45 min</li>
          <li>Brow tint: 15 min.</li>
        </ul>
      )
    },
    {
      question: "How to Prepare",
      answer: (
        <ul className="list-disc pl-5 space-y-1">
          <li>Arrive with clean skin, no brow makeup.</li>
          <li>Avoid Retinoids 1 week prior to appointment.</li>
        </ul>
      )
    },
    {
      question: "Aftercare",
      answer: (
        <ul className="list-disc pl-5 space-y-1">
          <li>Keep brows dry and avoid touching for 24 hours.</li>
          <li>Avoid exfoliants or oil-based products around the brows for 48 hours.</li>
          <li>Brush brows up daily to maintain shape that you want.</li>
        </ul>
      )
    },
    {
      question: "Will a brow lamination damage my brow hair?",
      answer: "When done correctly with nourishing formulas, they are gentle and safe."
    }
  ],
  'Microblading & PMU': [
    {
      question: "Appointment Lengths",
      answer: (
        <ul className="list-disc pl-5 space-y-1">
          <li>Microblading / Nano Brows/lip blushing initial appointment: 2–4 hours</li>
          <li>Touch-Ups: 1–2 hours</li>
        </ul>
      )
    },
    {
      question: "How to Prepare",
      answer: (
        <ul className="list-disc pl-5 space-y-1">
          <li>Avoid alcohol, caffeine, and blood thinners 24 hrs before.</li>
          <li>Arrive with clean skin and no makeup.</li>
        </ul>
      )
    },
    {
      question: "Aftercare for brows",
      answer: (
        <ul className="list-disc pl-5 space-y-1">
          <li>Keep brows dry and clean.</li>
          <li>Avoid picking, sweating, or steam for 7–10 days.</li>
          <li>Expect flaking and lightening during healing.</li>
          <li>Follow all post-care instructions from your artist.</li>
        </ul>
      )
    },
    {
      question: "Aftercare for lips",
      answer: (
        <ul className="list-disc pl-5 space-y-1">
          <li>Avoid picking, scratching, or rubbing the lips (let scabs or flakes shed naturally).</li>
          <li>Avoid hot, spicy, salty, or citrus foods and alcohol for the first 3–5 days.</li>
          <li>Avoid applying makeup or skincare products on/around the lips.</li>
          <li>Avoid sun exposure or tanning.</li>
        </ul>
      )
    }
  ],
  'Botox & Injectables': [
    {
      question: "Appointment Length",
      answer: "15–45 min"
    },
    {
      question: "How to Prepare",
      answer: (
        <ul className="list-disc pl-5 space-y-1">
          <li>Avoid alcohol and blood thinners 24 hrs prior.</li>
          <li>Arrive with clean skin.</li>
          <li>3-7 Days Before: Avoid blood-thinning medications/supplements if medically safe. Pause active skincare. Stay hydrated. Avoid tanning/sunburns.</li>
          <li>Day of: Arrive with clean skin. Avoid excess caffeine or alcohol.</li>
        </ul>
      )
    },
    {
      question: "Aftercare",
      answer: (
        <ul className="list-disc pl-5 space-y-1">
          <li>No laying down, exercise, or massaging the area for 24 hrs.</li>
          <li>Avoid heat or facials for 2 weeks post-treatment</li>
          <li>First 4-6 Hours: Stay upright. Avoid rubbing/touching. Keep head elevated. Avoid strenuous exercise.</li>
          <li>First 24 Hours: No makeup/facials/massages. Avoid alcohol. Keep area clean.</li>
          <li>First 2 Weeks: Botox takes 3-14 days to settle. Minor swelling is normal. Continue gentle skincare.</li>
        </ul>
      )
    }
  ],
  'Facials': [
    {
      question: "Appointment Lengths",
      answer: (
        <ul className="list-disc pl-5 space-y-1">
          <li>Standard Facial: 45 min–1 hr</li>
          <li>HydraFacials: 1–1.5 hrs</li>
        </ul>
      )
    },
    {
      question: "How to Prepare",
      answer: (
        <ul className="list-disc pl-5 space-y-1">
          <li>Arrive with clean skin.</li>
          <li>Avoid exfoliating products (including shaving and waxing), Retin-A, Tretinoin, and Benzoyl Peroxide for at least five days prior.</li>
          <li>Avoid tanning or sunburn for at least 48 hours before.</li>
          <li>Shave the day before (if needed) — not the same day.</li>
          <li>Stay hydrated!</li>
        </ul>
      )
    },
    {
      question: "Aftercare",
      answer: (
        <ul className="list-disc pl-5 space-y-1">
          <li>Avoid touching your face or applying makeup for at least 6 hours.</li>
          <li>Skip workouts, saunas, or hot showers for 24 hours.</li>
          <li>No exfoliation, retinol, or strong actives for 3–5 days after.</li>
          <li>Use gentle cleansers and moisturizers only for the first couple of days.</li>
          <li>Always wear SPF 30+ daily.</li>
          <li>Avoid tanning or direct sun for at least 72 hours.</li>
          <li>Hydrate well.</li>
        </ul>
      )
    }
  ],
  'Permanent Jewelry': [
    {
      question: "What is permanent jewelry?",
      answer: "Jewelry without a clasp! Our team of professionals will weld your custom piece directly onto your wrist, ankle, or neck, so you can flaunt your forever jewelry, forever!"
    },
    {
      question: "How long does it take?",
      answer: "Take your time picking out your custom chain + charm combination, but the weld itself takes under a second! Low effort, high reward. (Appointment length: 10-20 min per piece)"
    },
    {
      question: "Does it hurt?",
      answer: "Not a bit! The weld is completely safe, but we also use a protective piece of leather between your skin and the spark just as an extra precaution!"
    },
    {
      question: "How long does it last?",
      answer: "Your weld should last until you’re ready to remove it, unless it gets caught on something and breaks (in which case, we can re-weld it at one of our pop ups). To help your jewelry last as long as possible: be careful when doing activities that may tug on your jewelry and wash it regularly with soap and warm water to keep that shine!"
    },
    {
      question: "Can my jewelry go through airport security?",
      answer: "Yes! You shouldn’t experience any issues with TSA."
    },
    {
      question: "What if I need to remove my permanent jewelry?",
      answer: "You can carefully use a pair of wire cutters to cut your bracelet off when you are ready to part with your piece. Pro tip: cut it at the jump ring that connects your chain and bring it back later to one of our pop ups to re-weld it!"
    }
  ],
  'Waxing': [
    {
      question: "Appointment Lengths",
      answer: (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>Brows: 20-30 mins</div>
          <div>Face: 30 min</div>
          <div>Upper lip: 15 min</div>
          <div>Chin: 15 min</div>
          <div>Legs: 30-45 min</div>
          <div>Full arms: 45 min</div>
          <div>Half arms: 30 min</div>
          <div>Underarm: 30 min</div>
          <div>Brazilian: 45 min</div>
        </div>
      )
    },
    {
      question: "How to Prepare",
      answer: (
        <ul className="list-disc pl-5 space-y-1">
          <li>Let hair grow to at least ¼ inch.</li>
          <li>Avoid sun exposure, tanning, or aggressive exfoliants (like retinol or acids) for 24–48 hours before.</li>
          <li>The Day Of: Arrive with clean, dry skin (no lotions/oils). Avoid excess caffeine/alcohol. Wear loose-fitting clothing.</li>
        </ul>
      )
    },
    {
      question: "Aftercare",
      answer: (
        <ul className="list-disc pl-5 space-y-1">
          <li>Avoid heat, sweat, and tight clothing for 24 hrs.</li>
          <li>Exfoliate gently 2–3 days post-wax to prevent ingrowns.</li>
          <li>Moisturize daily.</li>
          <li>Do not shave or tweeze between wax appointments.</li>
          <li>Book waxes regularly every 4–6 weeks for best results.</li>
        </ul>
      )
    }
  ]
}

export function FAQSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-10%" })
  const [expandedIndex, setExpandedIndex] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<FAQCategory | 'All'>('All')

  const toggleFAQ = (id: string) => {
    setExpandedIndex(expandedIndex === id ? null : id)
  }

  // Filter FAQs based on active category
  const filteredFAQs = activeCategory === 'All' 
    ? Object.entries(faqData).flatMap(([category, items]) => 
        items.map((item, index) => ({ ...item, category, id: `${category}-${index}` }))
      )
    : faqData[activeCategory as string]?.map((item, index) => ({ 
        ...item, 
        category: activeCategory, 
        id: `${activeCategory}-${index}` 
      })) || []

  return (
    <section ref={ref} className="pb-20 bg-cream">
      <div className="container max-w-4xl">
        {/* Category Sorter - Beautiful Frosted Glass Chips */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-wrap justify-center gap-3">
            {['All', ...categories].map((category, index) => (
              <motion.button
                key={category}
                onClick={() => setActiveCategory(category as FAQCategory | 'All')}
                className="relative group"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Active/Hover State Background */}
                <div className={`absolute inset-0 rounded-full transition-opacity duration-300 ${
                  activeCategory === category 
                    ? 'bg-dusty-rose shadow-md' 
                    : 'bg-white/50 hover:bg-white/80'
                }`} />
                
                {/* Content */}
                <div className={`relative px-4 py-2 rounded-full border transition-colors duration-300 ${
                  activeCategory === category
                    ? 'border-dusty-rose text-white'
                    : 'border-white/60 text-dune hover:border-dusty-rose/30'
                }`}>
                  <span className="text-sm font-medium whitespace-nowrap">
                    {category}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* FAQ Items */}
        <motion.div
          className="space-y-4"
          layout
        >
          <AnimatePresence mode="popLayout">
            {filteredFAQs.map((faq) => (
              <motion.div
                key={faq.id}
                layout
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-sage/10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between group"
                >
                  <div className="flex flex-col items-start gap-1">
                    {activeCategory === 'All' && (
                      <span className="text-xs font-medium text-dusty-rose uppercase tracking-wider">
                        {faq.category}
                      </span>
                    )}
                    <h3 className="font-sans font-semibold text-dune group-hover:text-dusty-rose transition-colors pr-8">
                      {faq.question}
                    </h3>
                  </div>
                  <motion.div
                    className="shrink-0 ml-4 text-dusty-rose bg-dusty-rose/10 rounded-full p-1.5 group-hover:bg-dusty-rose group-hover:text-white transition-colors duration-300"
                    animate={{ rotate: expandedIndex === faq.id ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </motion.div>
                </button>

                <AnimatePresence>
                  {expandedIndex === faq.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    >
                      <div className="px-6 pb-6 pt-2 border-t border-sage/5">
                        <div className="body text-dune/80 leading-relaxed space-y-4">
                          {faq.answer}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p className="body text-dune/70 mb-4">
            Still have questions?
          </p>
          <a
            href="mailto:hello@lashpopstudios.com"
            className="btn btn-secondary inline-flex items-center gap-2 bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Contact Us
          </a>
        </motion.div>
      </div>
    </section>
  )
}
