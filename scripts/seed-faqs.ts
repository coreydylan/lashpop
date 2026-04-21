/**
 * Seed script to migrate hardcoded FAQs to the database
 * Run with: npx tsx scripts/seed-faqs.ts
 */

import { config } from 'dotenv'
config({ path: '.env' })

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { faqCategories, faqItems } from '../src/db/schema/faqs'

const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString, { max: 1 })
const db = drizzle(client)

// All FAQ data from the current FAQSection component
const faqData: Record<string, Array<{ question: string; answer: string; isFeatured?: boolean }>> = {
  'Booking & Appointments': [
    {
      question: "How do I book an appointment?",
      answer: `You can easily book online by clicking the Book Now button at the top of this page then choose a service, choose a time, and request an appointment. You will receive a confirmation email and text once your appointment is approved.`,
      isFeatured: true
    },
    {
      question: "How do I know which service to book?",
      answer: `<p class="mb-2">Not sure which lash style fits you? Take our "lash quiz" on the homepage to find your perfect lash style.</p><p>For brows, facials, Botox, permanent jewelry, or waxing, browse our "Meet the Team" page to find your ideal provider, or call/text the LashPop line and we'll match you with a service provider we think would be the best fit for you.</p>`,
      isFeatured: true
    },
    {
      question: "Independent stylists vs. employees - what's the difference?",
      answer: `<p class="mb-2">We're a hybrid salon, meaning we have both LashPop employees and independent beauty businesses renting space under our roof. Each independent service provider sets their own pricing/policies and handles their own bookings and client relationships.</p><p class="mb-2">Each team member has been carefully hand selected to be under the LashPop brand, so either way, you'll be in great hands whether you book with an employee or independent artist.</p><p>When you book with a specific stylist, your deposit, rescheduling, and cancellation policies follow their terms, though we aim for consistency in standards across all stylists.</p>`
    },
    {
      question: "How to Prepare for Your Appointment",
      answer: `<ul class="list-disc pl-5 space-y-1"><li>Use the restroom before your appointment.</li><li>Bring headphones or your own playlist if you want to zone out and relax.</li><li>Bring a sweater or light blanket - we keep our studio at 70-72F for certain products.</li><li>Plan to lay fairly still throughout the service.</li><li>Try to minimize talking during lash services to avoid fluttering eyes or movement that can affect application.</li></ul>`,
      isFeatured: true
    },
    {
      question: "Parking & Studio Entry/Door Code",
      answer: `<p class="mb-2"><strong>Parking:</strong> Free street parking is available all around near the studio. There is also a shared parking lot on the north end of the building.</p><p class="mb-2"><strong>Why we use a door code:</strong> The front door will be locked when you arrive. This helps us create a peaceful, uninterrupted environment for your service and ensures that only scheduled clients and team members have access to the studio. It's simply an extra layer of comfort and safety for both our guests and our team — while keeping out unexpected solicitors or walk-ins. :)</p><p class="mb-2">You will receive the door code from your stylist after booking. Be sure to save the code for your future appointments :) and reach out to your stylist if you are having any issues entering the space.</p><p>Please arrive a few minutes early and make yourself at home in our waiting area. Use the restroom and grab a complimentary coffee or tea while you wait for your stylist to come get you.</p>`
    }
  ],
  'Policies': [
    {
      question: "LashPop Studio policies: Children & Pets",
      answer: `<ul class="list-disc pl-5 space-y-1"><li>To maintain a peaceful, clean environment and ensure safety, we ask that you do not bring children under 10 or pets to your appointment.</li><li>If you do bring a guest, we ask that they just be mindful of our peaceful atmosphere. :)</li></ul>`,
      isFeatured: true
    },
    {
      question: "Cell Phones & Courtesy",
      answer: `<ul class="list-disc pl-5 space-y-1"><li>During your service, we ask that you silence your phone to help keep our shared space a peaceful atmosphere for other guests.</li><li>We try to keep conversation at a soft level to allow for others to relax.</li></ul>`
    },
    {
      question: "Policies for our Independent LP team members",
      answer: `Each of our independent beauty businesses determine their own policies regarding deposits, payment, cancellation fees, late policies, refunds, etc. Check with your specific service provider to confirm their policies regarding your appointment if you have any questions.`,
      isFeatured: true
    },
    {
      question: "Referral Program & Discounts",
      answer: `<p class="mb-2">Receive $25 off with any LashPop employee if you refer a friend. Your friend will also receive $25 off their first appointment. It must be used with that specific LashPop employee.</p><p>Because our team is made up of independent stylists, each artist chooses their own client pricing, and promotions. You can always check with your service provider about any referral programs or promos.</p>`
    },
    {
      question: "Cancellation Policy",
      answer: `Please contact your stylist directly for any appointment changes or cancellations, as each independent beauty business at our studio sets its own policies for deposits, payments, cancellation fees, late arrivals, and refunds. If you cancel within 24 to 48 hours of your appointment, you may be responsible for part or all of the service cost. If you have any questions about your appointment, please check with your specific service provider to confirm their policy.`,
      isFeatured: true
    }
  ],
  'Lash Extensions': [
    {
      question: "What is the cost?",
      answer: `We're a beauty collective, and each of our stylists is an independent professional/business, so pricing depends on the stylist and which style of lashes you want. A full set will range from $150-$250 depending on those factors and fills will range from $75-$120.`,
      isFeatured: true
    },
    {
      question: "Appointment Lengths",
      answer: `<ul class="list-disc pl-5 space-y-1"><li>Classic Full Set: 1.5 - 2 hours</li><li>Classic Fill: 60 - 75 mins</li><li>Classic Mini Fill: 30 mins</li><li>Wet/Angel Style Full Set: 1.5 - 2 hours</li><li>Wet/Angel Style Fill: 60 - 75 mins</li><li>Wet/Angel Style Mini Fill: 30 - 45 mins</li><li>Hybrid Full Set: 1.5 - 2 hours</li><li>Hybrid Fill: 60 - 75 mins</li><li>Hybrid Mini Fill: 30 - 45 mins</li><li>Volume Full Set: 2 - 2.5 hours</li><li>Volume Fill: 1.5 hours</li><li>Volume Mini Fill: 30 - 45 mins</li><li>Removal: 30 - 45 mins</li></ul>`,
      isFeatured: true
    },
    {
      question: "What is the process and how long will they last?",
      answer: `<p class="mb-2">Getting eyelash extensions is a simple, relaxing process. Your appointment starts with a consultation where your stylist talks through your desired look, eye shape, natural lash health, and options for style, curl, length, and color. Once your lashes are cleansed and prepped, you will lay back with your eyes closed while individual extensions are carefully applied to each of your natural lashes.</p><p class="mb-2">When your appointment is finished, you will leave with fuller, customized lashes and aftercare instructions to help them last as long as possible.</p><p>A full set of lashes will last 2-4 weeks, depending on your natural lash cycle, lifestyle, and how well you care for them. Because your natural lashes shed daily, your extensions will shed with them (this is completely normal). We recommend coming in for lash fills every 2-3 weeks.</p>`
    },
    {
      question: "How to Prepare",
      answer: `<ul class="list-disc pl-5 space-y-1"><li>Arrive with clean, makeup-free lashes.</li><li>Silence your phone.</li><li>Keep talking to a minimum to avoid eye movement during application.</li><li>Use the restroom before your appointment if needed.</li><li>Bring headphones and your phone if you'd like to listen to your own music or podcasts.</li><li>Bring a blanket or sweater (we keep our studio at 70-72 degrees for certain products).</li></ul>`
    },
    {
      question: "Aftercare & Maintenance",
      answer: `<ul class="list-disc pl-5 space-y-1"><li>Clean lashes daily with a lash cleanser and gentle fluffy cleanser brush</li><li>Gently brush with a clean lash brush.</li><li>No mascara, eyeliner, or oil-based products on the lashes.</li><li>Do not use eyelash curlers or waterproof makeup around the lashes</li><li>Avoid rubbing, pulling, picking</li><li>Fills every 2–3 weeks are recommended</li></ul>`,
      isFeatured: true
    },
    {
      question: "Will lash extensions damage my natural lashes?",
      answer: `<p class="mb-2">Damage only happens if they are done incorrectly (we've got you covered here), or do not care for them properly (pulling at them, rubbing your eyes, sleeping on your face, not keeping them clean).</p><p>We are committed to best practices in application, to ensure healthy lashes for our clients! So as long as you are committed to following the simple aftercare instructions, you'll be good.</p>`
    },
    {
      question: "How often do I need to come in for fills/touchups?",
      answer: `Fills are recommended every 2-3 weeks.`,
      isFeatured: true
    },
    {
      question: "Can I have an allergic reaction to lash extensions?",
      answer: `<p class="mb-2">Unfortunately reactions can happen if you are allergic to any ingredients in the lash glue. However, we do have a sensitive glue option as an alternative.</p><p>We can always do a "mini" appointment for new clients to test if you are allergic before doing the full set.</p>`
    }
  ],
  'Lash Lifts & Tints': [
    {
      question: "What is the cost?",
      answer: `We're a beauty collective, and each of our stylists is an independent professional/business, so the price of a lash lift and tint will range from $120-125 depending on the stylist.`
    },
    {
      question: "Appointment Length",
      answer: `Lash Lift & Tint: 60-75 mins.`
    },
    {
      question: "What is the process and how long will it last?",
      answer: `A lash lift and tint enhances your natural lashes using a two step process that lifts/curls the lashes upward to give them a longer appearance without the maintenance of lash extensions. A tint is then added to give your lashes a darker appearance. Low maintenance. Lasts 6-8 weeks.`
    },
    {
      question: "How to Prepare",
      answer: `<ul class="list-disc pl-5 space-y-1"><li>Arrive with clean, makeup-free lashes.</li><li>Remove contacts if you wear them.</li><li>Silence your phone.</li><li>Keep talking to a minimum to avoid eye movement during application.</li><li>Use the restroom before your appointment if needed.</li><li>Bring headphones and your phone if you'd like to listen to your own music or podcasts.</li><li>Bring a blanket or sweater (we keep our studio at 70-72 degrees for certain products).</li></ul>`
    },
    {
      question: "Aftercare & Maintenance",
      answer: `<ul class="list-disc pl-5 space-y-1"><li>Avoid water, steam, and makeup on lashes for 24–48 hours.</li><li>Use nourishing serums if desired.</li><li>Book this service 6-8 weeks apart to avoid over-processing.</li></ul>`
    },
    {
      question: "Will lash lifts damage my natural lashes?",
      answer: `When done professionally, lash lifts are gentle and safe.`,
      isFeatured: true
    }
  ],
  'Brows': [
    {
      question: "Which brow services do you offer?",
      answer: `We offer brow laminations, brow tinting, brow waxing, microblading and nanobrows.`
    },
    {
      question: "What is the cost?",
      answer: `We're a beauty collective, and each of our stylists is an independent professional/business, so the price of our brow services will vary depending on the stylist. Check out the services or book now section for specific brow pricing.`
    },
    {
      question: "Appointment Lengths",
      answer: `<ul class="list-disc pl-5 space-y-1"><li>Brow Lamination + Tint: 45 - 60 mins</li><li>Brow Lamination: 45 mins</li><li>Brow Tint: 15 mins</li><li>Brow Wax/Shaping: 15 - 30 mins</li><li>Microblading: See Microblading and PMU FAQ section</li><li>Nanobrows: See Microblading and PMU FAQ section</li></ul>`
    },
    {
      question: "What is the process and how long will they last?",
      answer: `<p class="mb-2"><strong>Brow Lamination and Tint:</strong> A Brow Lamination gives your brows a set, uniform shape for 6-8 weeks. This treatment relaxes your brow hair so you're able to manipulate the hair in a more desirable shape of your choice, and give you a bolder/fuller brow.</p><p class="mb-2"><strong>Brow Wax/Shaping:</strong> A brow wax and shaping appointment is a quick, simple service designed to clean up and define your brows. Your stylist will assess your natural brow shape, discuss your goals, and carefully remove unwanted hair to create a more balanced, polished look that complements your features.</p><p class="mb-2"><strong>Microblading:</strong> See Microblading & PMU FAQ section</p><p><strong>Nanobrows:</strong> See Microblading & PMU FAQ section</p>`
    },
    {
      question: "How to Prepare",
      answer: `<p class="mb-2"><strong>Brow Lamination + Tint:</strong> Avoid using retinol, exfoliants, and active skincare around the brow area for 5 - 7 days beforehand to prevent sensitivity. Do not wax, tweeze, or trim your brows prior to your appointment, as your artist will shape them as needed. Arrive with clean, dry brows free of makeup, oils, or skincare, and avoid using oil-based products leading up to your service to ensure the best results. It's also important to avoid sunburn or any irritation in the brow area before your appointment.</p><p class="mb-2"><strong>Brow Wax/Shaping:</strong> Come with clean make-up free brows. Let your brows grow out for 2–3 weeks for the best shape. Avoid sun exposure or tanning before your appointment. Skip strong exfoliants or acne treatments near the brow area. Avoid using oil-based products around the brows before your appointment.</p><p class="mb-2"><strong>Microblading:</strong> See Microblading and PMU FAQ section</p><p class="mb-2"><strong>Nanobrows:</strong> See Microblading and PMU FAQ section</p><p><strong>General Preparation:</strong> Silence your phone. Use the restroom before your appointment if needed. Bring headphones and your phone if you'd like to listen to your own music or podcasts. Bring a blanket or sweater (we keep our studio at 70-72 degrees for certain products).</p>`,
      isFeatured: true
    },
    {
      question: "Aftercare",
      answer: `<p class="mb-2"><strong>Brow Wax Aftercare:</strong> Expect slight redness, this is normal and should subside within a few hours. Avoid makeup, sweating, and sun exposure for 24 hours. Do not use retinol, exfoliants, or active skincare on the area for 2–3 days. Apply a soothing gel (like aloe) if needed.</p><p class="mb-2"><strong>Brow Lamination + Tint Aftercare:</strong> Keep your brows completely dry for 24 hours, avoid cleansing, scrubbing, steam, sweating, saunas, makeup, and skincare around the brow area, skip oil-based products to help the tint last longer, expect the color to soften slightly over the first few days, and brush your brows daily while using a nourishing oil or serum to keep them healthy.</p><p class="mb-2"><strong>Microblading Aftercare:</strong> See Microblading & PMU FAQ section</p><p><strong>Nanobrows Aftercare:</strong> See Microblading & PMU FAQ section</p>`
    }
  ],
  'Skincare': [
    {
      question: "What is the process?",
      answer: `<p class="mb-2">Both facials and Hydrafacials begin with a skin consultation, followed by a treatment designed to cleanse, exfoliate, and hydrate your skin.</p><p class="mb-2">A custom facial typically includes cleansing, exfoliation, extractions (if needed), a targeted mask, and finishing products to leave your skin refreshed and glowing.</p><p>A Hydrafacial uses advanced technology to deeply cleanse, extract impurities, and infuse the skin with hydrating serums for instant, noticeable results.</p>`
    },
    {
      question: "What is the cost?",
      answer: `We're a beauty collective, and each of our stylists is an independent professional/business, so the price of our skincare and facial services will vary depending on the stylist. Check out the services or book now section for specific skincare and facial pricing.`
    },
    {
      question: "Appointment Lengths",
      answer: `<ul class="list-disc pl-5 space-y-1"><li>Standard Facial: 45 min–1 hr</li><li>HydraFacials: 1–1.5 hrs</li></ul>`
    },
    {
      question: "How to Prepare",
      answer: `<ul class="list-disc pl-5 space-y-1"><li>Arrive with clean make-up and product free skin.</li><li>Avoid exfoliating products (including shaving and waxing), Retin-A, Tretinoin, and Benzoyl Peroxide for at least five days prior.</li><li>Avoid tanning or sunburn for at least 48 hours before.</li><li>Shave the day before (if needed), not the same day.</li><li>Stay hydrated!</li><li>Silence your phone.</li><li>Use the restroom before your appointment if needed.</li><li>Bring headphones and your phone if you'd like to listen to your own music or podcasts.</li><li>Bring a blanket or sweater (we keep our studio at 70-72 degrees for certain products).</li></ul>`
    },
    {
      question: "Aftercare",
      answer: `<ul class="list-disc pl-5 space-y-1"><li>Avoid touching your face or applying makeup for at least 6 hours.</li><li>Skip workouts, saunas, or hot showers for 24 hours.</li><li>No exfoliation, retinol, or strong actives for 3–5 days after.</li><li>Use gentle cleansers and moisturizers only for the first couple of days.</li><li>Always wear SPF 30+ daily.</li><li>Avoid tanning or direct sun for at least 72 hours.</li><li>Hydrate well.</li></ul>`
    }
  ],
  'Waxing': [
    {
      question: "Appointment Lengths",
      answer: `<div class="grid grid-cols-2 gap-2 text-sm"><div>Brows: 20-30 mins</div><div>Face: 30 min</div><div>Upper lip: 15 min</div><div>Chin: 15 min</div><div>Legs: 30-45 min</div><div>Full arms: 45 min</div><div>Half arms: 30 min</div><div>Underarm: 30 min</div><div>Brazilian: 45 min</div></div>`
    },
    {
      question: "How to Prepare",
      answer: `<ul class="list-disc pl-5 space-y-1"><li>Let hair grow to at least ¼ inch.</li><li>Avoid sun exposure, tanning, or aggressive exfoliants (like retinol or acids) for 24–48 hours before.</li><li>The Day Of: Arrive with clean, dry skin (no lotions/oils). Avoid excess caffeine/alcohol. Wear loose-fitting clothing.</li><li>Silence your phone.</li><li>Use the restroom before your appointment if needed.</li><li>Bring headphones and your phone if you'd like to listen to your own music or podcasts.</li><li>Bring a blanket or sweater (we keep our studio at 70-72 degrees for certain products).</li></ul>`
    },
    {
      question: "What is the Process?",
      answer: `<p class="mb-2">Your waxing appointment begins with a quick consultation to review your skin and desired results. The area is then cleansed and prepped before your esthetician carefully removes unwanted hair using professional-grade wax.</p><p>After the wax, a soothing product is applied to calm the skin and reduce any redness or irritation.</p>`
    },
    {
      question: "Aftercare",
      answer: `<ul class="list-disc pl-5 space-y-1"><li>Avoid heat, sweat, and tight clothing for 24 hrs.</li><li>Exfoliate gently 2–3 days post-wax to prevent ingrowns.</li><li>Moisturize daily.</li><li>Do not shave or tweeze between wax appointments.</li><li>Book waxes regularly every 4–6 weeks for best results.</li></ul>`
    }
  ],
  'Microblading & Permanent Makeup': [
    {
      question: "What is the cost?",
      answer: `We're a beauty collective, and each of our stylists is an independent professional/business, so the price of our microblading/nanobrows and PMU services will vary depending on the stylist. Check out the services or book now section for specific microblading/nanobrows and permanent make-up pricing.`
    },
    {
      question: "Appointment Lengths",
      answer: `<ul class="list-disc pl-5 space-y-1"><li>Microblading / Nano Brows initial appointment: 2–4 hours</li><li>Touch-Ups: 1–2 hours</li></ul>`
    },
    {
      question: "What is the Process?",
      answer: `Each appointment begins with a consultation and custom design, including shape and color selection. Once approved, pigment is carefully implanted into the skin using precise techniques. A perfecting touch-up is scheduled at 6–8 weeks for best results.`
    },
    {
      question: "How to Prepare",
      answer: `<ul class="list-disc pl-5 space-y-1"><li>Avoid alcohol, caffeine, and blood thinners 24 hours before</li><li>Do not take ibuprofen or aspirin prior to your service</li><li>Avoid retinol, exfoliants, and active skincare in the brow area for 5–7 days before</li><li>No sunburn, tanning, or facials at least 1 week prior</li><li>Arrive with clean skin and no make-up</li><li>Silence your phone.</li><li>Use the restroom before your appointment if needed.</li><li>Bring headphones and your phone if you'd like to listen to your own music or podcasts.</li><li>Bring a blanket or sweater (we keep our studio at 70-72 degrees for certain products).</li></ul>`
    },
    {
      question: "Aftercare",
      answer: `<ul class="list-disc pl-5 space-y-1"><li>Keep brows clean and dry for the first 7-10 days.</li><li>Avoid sweating, steam, swimming, and excessive heat for the first 7-10 days.</li><li>Apply healing ointment as directed by your artist.</li><li>Do not pick, scratch, or rub the area, allow any flaking to shed naturally.</li><li>Avoid applying makeup, skincare, or sunscreen directly on the brows.</li><li>Avoid sun exposure, tanning, and facials while healing.</li><li>Expect light flaking, scabbing, and lightening of color.</li></ul>`
    }
  ],
  'Permanent Jewelry': [
    {
      question: "What is permanent jewelry?",
      answer: `Jewelry without a clasp! Kelly at Junie Jewelry Co. will weld your custom piece directly onto your wrist, ankle, or neck, so you can flaunt your forever jewelry, forever!`,
      isFeatured: true
    },
    {
      question: "How long does it take?",
      answer: `Take your time picking out your custom chain + charm combination, but the weld itself takes under a second! Low effort, high reward. (Appointment length: 10-20 min per piece)`
    },
    {
      question: "Does it hurt?",
      answer: `Not a bit! The weld is completely safe, but we also use a protective piece of leather between your skin and the spark just as an extra precaution!`
    },
    {
      question: "How long does it last?",
      answer: `Your weld should last until you're ready to remove it, unless it gets caught on something and breaks (in which case, we can re-weld it at one of our pop ups). To help your jewelry last as long as possible: be careful when doing activities that may tug on your jewelry and wash it regularly with soap and warm water to keep that shine!`
    },
    {
      question: "Can my jewelry go through airport security?",
      answer: `Yes! You shouldn't experience any issues with TSA.`
    },
    {
      question: "What if I need to remove my permanent jewelry?",
      answer: `You can carefully use a pair of wire cutters to cut your bracelet off when you are ready to part with your piece. Pro tip: cut it at the jump ring that connects your chain and bring it back later to one of our pop ups to re-weld it!`
    }
  ],
  'Botox': [
    {
      question: "Appointment Length",
      answer: `15–45 min`
    },
    {
      question: "How to Prepare",
      answer: `<ul class="list-disc pl-5 space-y-1"><li>Avoid alcohol and blood thinners 24 hrs prior.</li><li>Arrive with clean skin.</li><li>3-7 Days Before: Avoid blood-thinning medications/supplements if medically safe. Pause active skincare. Stay hydrated. Avoid tanning/sunburns.</li><li>Day of: Arrive with clean skin. Avoid excess caffeine or alcohol.</li></ul>`
    },
    {
      question: "Aftercare",
      answer: `<ul class="list-disc pl-5 space-y-1"><li>No laying down, exercise, or massaging the area for 24 hrs.</li><li>Avoid heat or facials for 2 weeks post-treatment</li><li>First 4-6 Hours: Stay upright. Avoid rubbing/touching. Keep head elevated. Avoid strenuous exercise.</li><li>First 24 Hours: No makeup/facials/massages. Avoid alcohol. Keep area clean.</li><li>First 2 Weeks: Botox takes 3-14 days to settle. Minor swelling is normal. Continue gentle skincare.</li></ul>`
    }
  ]
}

async function seedFAQs() {
  console.log('🌱 Starting FAQ seed...\n')

  // First, clear existing data
  console.log('Clearing existing FAQ data...')
  await db.delete(faqItems)
  await db.delete(faqCategories)
  console.log('✓ Cleared existing data\n')

  // Create categories and items
  let categoryOrder = 0
  let totalItems = 0

  for (const [categoryName, items] of Object.entries(faqData)) {
    // Create category
    const [category] = await db
      .insert(faqCategories)
      .values({
        name: categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        displayName: categoryName,
        displayOrder: categoryOrder++,
        isActive: true
      })
      .returning()

    console.log(`📁 Created category: ${categoryName}`)

    // Create items for this category
    let itemOrder = 0
    for (const item of items) {
      await db
        .insert(faqItems)
        .values({
          categoryId: category.id,
          question: item.question,
          answer: item.answer,
          displayOrder: itemOrder++,
          isActive: true,
          isFeatured: item.isFeatured || false
        })
      totalItems++
    }
    console.log(`   └─ Added ${items.length} FAQs (${items.filter(i => i.isFeatured).length} featured)`)
  }

  console.log(`\n✅ Seeded ${Object.keys(faqData).length} categories with ${totalItems} FAQ items`)
  console.log(`   Featured items: ${Object.values(faqData).flat().filter(i => i.isFeatured).length}`)

  await client.end()
  process.exit(0)
}

seedFAQs().catch(err => {
  console.error('❌ Error seeding FAQs:', err)
  process.exit(1)
})

