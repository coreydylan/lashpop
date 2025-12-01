import { config } from "dotenv"
config({ path: ".env.local" })

import { db } from "@/db"
import { teamMembers } from "@/db/schema/team_members"
import { teamQuickFacts } from "@/db/schema/team_quick_facts"
import { eq } from "drizzle-orm"

/**
 * Manually curated quick facts extracted from team member bios
 * Each entry maps team member name to their quick facts
 */
const quickFactsData: Record<string, Array<{
  factType: string
  value: string
  customLabel?: string
}>> = {
  "Rachel Edwards": [
    { factType: "fun_fact", value: "She sings! Has performed in musicals since childhood and had a voice coach" },
    { factType: "movie", value: "Ella Enchanted" },
    { factType: "coffee", value: "Large Protein coffee from Dutch Bros" },
  ],
  "Ryann Alcorn": [
    { factType: "hidden_talent", value: "Also a hair stylist and makeup artist" },
    { factType: "tv_show", value: "New Girl" },
    { factType: "drink", value: "Iced vanilla matcha" },
  ],
  "Emily Rogers": [
    { factType: "fun_fact", value: "Originally started LashPop as a side hustle while pursuing a singing career" },
    { factType: "movie", value: "You've Got Mail" },
    { factType: "tv_show", value: "Schitt's Creek" },
    { factType: "coffee", value: "Iced cinnamon honey latte (or a spicy margarita)" },
  ],
  "Grace Ramos": [
    { factType: "hidden_talent", value: "Also a Certified Nurse Midwife catching babies when not doing injections!" },
    { factType: "movie", value: "Forrest Gump and LOTR: Return of the King" },
    { factType: "coffee", value: "Husband's homemade coffee (heavy cream, honey, vanilla)" },
  ],
  "Savannah Scherer": [
    { factType: "hobby", value: "Beach days with a good book and snacks from Seaside Market" },
    { factType: "coffee", value: "Iced matcha latte with oat milk or iced Mexican mocha from Black Rock" },
  ],
  "Evie Ells": [
    { factType: "fun_fact", value: "She's a triplet!" },
    { factType: "movie", value: "How to Lose a Guy in 10 Days (any Rom-Com with Matthew McConaughey)" },
    { factType: "coffee", value: "Extra Hot Triple americano with a splash of almond milk" },
    { factType: "hobby", value: "Hot yoga, Bravo TV, cats, and good red wine" },
  ],
  "Ashley Petersen": [
    { factType: "sport", value: "Plays tennis and runs half marathons in National Parks" },
    { factType: "movie", value: "The Notebook" },
    { factType: "coffee", value: "Vanilla latte" },
  ],
  "Kelly R": [
    { factType: "fun_fact", value: "Can recite The Nightmare Before Christmas word for word" },
    { factType: "movie", value: "The Nightmare Before Christmas" },
    { factType: "coffee", value: "Iced vanilla latte - basic but always good!" },
  ],
  "Bethany Peterson": [
    { factType: "hobby", value: "Loves musicals!" },
    { factType: "tv_show", value: "Bridgerton and Harry Potter" },
    { factType: "drink", value: "Matcha or chai lattes (coffee makes her crazy!)" },
  ],
  "Ava Mata": [
    { factType: "hidden_talent", value: "Decoding custom license plates - it's like a puzzle!" },
    { factType: "tv_show", value: "Yellowstone and Breaking Bad" },
    { factType: "coffee", value: "Iced vanilla latte with oat milk" },
  ],
  "Kelly Katona": [
    { factType: "fun_fact", value: "Used to be in musicals/plays and sing solos - but actually cannot sing, dance, or act!" },
    { factType: "movie", value: "Pride & Prejudice" },
    { factType: "drink", value: "Iced matcha with oat milk" },
  ],
  "Adrianna Arnaud": [
    { factType: "fun_fact", value: "Worked at In-N-Out Burger for 8.5 years - still visits weekly!" },
    { factType: "tv_show", value: "Reality TV" },
    { factType: "coffee", value: "Nitro cold brew with sweet cream" },
  ],
  "Kim Starnes": [
    { factType: "hobby", value: "Always has a good book in hand, rain or shine" },
    { factType: "coffee", value: "Iced Honey Latte" },
  ],
  "Nancy": [
    { factType: "pet", value: "Has a French Bulldog named... Frenchie!" },
    { factType: "hobby", value: "Exploring new coffee shops and thrifting" },
  ],
  "Haley Walker": [
    { factType: "hobby", value: "Loves camping and hiking" },
    { factType: "coffee", value: "Vanilla latte" },
  ],
  "Renee Belton": [
    { factType: "hidden_talent", value: "Used to make dream catchers and sell them in shops" },
    { factType: "movie", value: "Empire Records" },
    { factType: "coffee", value: "Vanilla latte or honey cinnamon latte" },
  ],
  "Elena Castellanos": [
    { factType: "fun_fact", value: "Loves to sing!" },
    { factType: "movie", value: "Independent movies", customLabel: "Favorite Movies" },
    { factType: "drink", value: "Soy cappuccino or herbal tea" },
  ],
}

/**
 * Updated bios with quick facts removed (cleaner, more professional)
 */
const cleanedBios: Record<string, string> = {
  "Rachel Edwards": `LashPop employee with 9 years in the beauty industry. Specializes in lash extensions, particularly classic lash extensions - they're classic for a reason, you can't go wrong with them! Loves the people this work allows her to meet and the connections made with them. Enjoys spending days off at the park with family.`,

  "Ryann Alcorn": `LashPop employee with 3 years in the beauty industry, but has been in love with all things beauty since she can remember! Favorite services are wispy wet sets or volume sets of lash extensions. The best part of working in this industry is helping people feel truly confident and comfortable in their own skin. On days off, you can find her discovering new coffee shops, hanging out at the beach, or hammocking somewhere with a pretty view!`,

  "Emily Rogers": `Owner of LashPop with 10 years in the beauty industry. Specializes in natural wispy brown lash extensions. Loves helping women of all ages and stages of life feel naturally beautiful and confident without ever feeling overdone. Also loves creating a peaceful and beautiful studio atmosphere that both clients and team love being in. On days off, enjoys being cozy at home, reading, baking, crafting, and playing piano (basically an 80 year old at heart).`,

  "Grace Ramos": `Working in the medical field since 2015, started NaturTox in 2024 expanding skills into aesthetics. Specializes in Botox injections and liquid IVs. Loves injections that make clients feel confident in their own skin - forehead and between eyes are favorites for satisfying results, but the secret weapon is lower face for a snatched jawline. Most loves genuinely connecting with each client - every appointment is more than a treatment, it's a relationship and chance to help someone feel more confident. On days off: slow mornings with kids, strength training outside, beach/park with kids, and family meals.`,

  "Savannah Scherer": `8 years in the beauty industry. Specializes in lash extensions, facials, and brows. Favorite service is facials because she enjoys the relaxation aspect and helping clients with their skincare goals. Loves being able to connect with a variety of different people - it's been a blessing being part of many people's lives throughout the years.`,

  "Evie Ells": `4.5 years in the beauty industry. Specializes in eyelash extensions and brows. Enjoys the creative and artistic aspect of lashing but loves seeing clients' faces light up when they see their results. It's amazing to help people feel more confident and beautiful, even in a subtle way. Days off start at hot yoga with husband, then anything outside in the sun!`,

  "Ashley Petersen": `8 years in the beauty industry. Specializes in hydra-facials, lash extensions, and brow laminations/tints. Loves the dermaplane and hydrafacial combination for the amazing after glow. Most loves enhancing natural beauty and providing ultimate skin health to amazing clientele. Days off include self-care treatments (sauna, cold plunge, red light therapy, sound baths, massage, chiropractic) or being outdoors in nature hiking or at the beach with her cutie 2 year old.`,

  "Kelly R": `Specializes in permanent makeup (microblading, nano brows, lip blushing), lash extensions, brow laminations/tints, lash lifts, and all waxing services. Favorite service is microblading - got it done herself and it made her feel beautiful and confident, loves giving that to others! Truly loves seeing how happy clients are when they look in the mirror after service. "Little" things like lashes or brows can really boost confidence and beauty. Days off are spent outside - beach walks, hikes with boyfriend and dog, NO phone!`,

  "Bethany Peterson": `Over 10 years in the beauty industry. Specializes in lash extensions and lash lifts. Favorite service is volume lashes - so rewarding - but loves wet looks right now for how they look. Most loves the people she gets to meet, hearing their stories and coming to love them. Days off are spent with family - doesn't have to be anything special, just loves the days they all have home together.`,

  "Ava Mata": `6 years in the beauty industry doing lashes. Favorite service is wet set full sets - loves getting creative with length, texture, and even brown lashes! Absolutely loves and adores the connections made with clients - nothing better than chatting and getting to know amazing women! Plus they leave feeling confident, relaxed, and obsessed with their lashes. Days off include hanging with loved ones, working out, being outside, or shopping!`,

  "Kelly Katona": `3 years in the beauty industry. Specializes in lash extensions and permanent jewelry. Loves the art of creating unique lash looks for each client - specifically hybrid lashes for their customizability. Most loves the confidence lashes inspire - one simple thing that allows clients to see their natural beauty magnified. Also loves the special connections made with clients. Days off: moving body, quality people, working on business/dreams, good food, sunsets.`,

  "Adrianna Arnaud": `6 years in the beauty industry. Specializes in lash extensions and lash lifts. Favorite services are lash lifts for their simple yet effective enhancement of natural lashes, and wet set lash extensions for fuller, darker look while maintaining natural appearance. Finds great fulfillment helping clients streamline morning routines and boost confidence. Having experienced the transformative effect of lash extensions herself, it's incredibly rewarding witnessing clients' reactions. Days off are spent with daughter and husband - mommy-and-me classes, parks, zoo, beach, or outdoor community events.`,

  "Kim Starnes": `Specializes in facials and dermaplaning. Favorite service is custom facials because each one is unique - loves tailoring every treatment to individual client needs, keeps things interesting and allows creativity while delivering real results. Most loves igniting confidence in clients - something special about helping someone feel good in their own skin. Values genuine connections built with clients over time. Creating a safe, welcoming space for relaxation is incredibly rewarding. Days off depend on weather: sunny means beach or trail hiking, rainy means snuggling up!`,

  "Nancy": `6 years in the beauty industry. Specializes in lash extensions, particularly classic lash extensions. On days off, likes going to the beach, gym, hanging out with kids, and thrifting. Enjoys going to local events, but loves being a homebody as well.`,

  "Haley Walker": `7 years in the beauty industry. Specializes in lash extensions, brow laminations, and waxing. Loves doing light volume lashes! Most loves making people feel comfortable and confident with lash and brow services. Days off are spent outside hiking or chilling in the sun.`,

  "Renee Belton": `5 years in the beauty industry, licensed for 11 years. Specializes in brow laminations, brow shaping/waxing/tinting, microblading, and facial waxing. Favorite service is brow laminations - such a satisfying treatment with instant beautiful results that transform the brow while looking natural. Loves how it enhances each client's unique brow shape for a fuller, lifted look without heavy makeup or permanent changes. Most loves enhancing natural beauty while helping clients feel confident and providing space to relax and care for themselves. Days off: shopping, relaxing at home with husband and cat, or at the gym.`,

  "Elena Castellanos": `In the beauty industry since 2020. Loves plasma rejuvenation as it's very effective and every skin type with any skin concern benefits from it. Most loves being part of someone's self care routine, building relationships with clients, and offering lasting results in a natural way. Days off are spent with family exploring, reading, eating out, and pampering herself.`,
}

async function populateQuickFacts() {
  console.log("🚀 Starting quick facts population...\n")

  // First, let's get all team members
  const allMembers = await db.select().from(teamMembers)
  console.log(`Found ${allMembers.length} team members\n`)

  let totalFactsAdded = 0
  let biosUpdated = 0

  for (const [memberName, facts] of Object.entries(quickFactsData)) {
    const member = allMembers.find(m => m.name === memberName)

    if (!member) {
      console.log(`⚠️  Team member not found: ${memberName}`)
      continue
    }

    console.log(`\n👤 ${memberName}:`)

    // Delete existing quick facts for this member (clean slate)
    await db.delete(teamQuickFacts).where(eq(teamQuickFacts.teamMemberId, member.id))

    // Insert new quick facts
    for (let i = 0; i < facts.length; i++) {
      const fact = facts[i]
      await db.insert(teamQuickFacts).values({
        teamMemberId: member.id,
        factType: fact.factType,
        value: fact.value,
        customLabel: fact.customLabel || null,
        displayOrder: i,
      })
      console.log(`   ✅ Added ${fact.factType}: ${fact.value.substring(0, 40)}...`)
      totalFactsAdded++
    }

    // Update bio if we have a cleaned version
    if (cleanedBios[memberName]) {
      await db
        .update(teamMembers)
        .set({
          bio: cleanedBios[memberName],
          updatedAt: new Date()
        })
        .where(eq(teamMembers.id, member.id))
      console.log(`   📝 Updated bio (removed quick facts)`)
      biosUpdated++
    }
  }

  console.log(`\n\n✨ Complete!`)
  console.log(`   📊 Total quick facts added: ${totalFactsAdded}`)
  console.log(`   📝 Bios updated: ${biosUpdated}`)
}

// Run the script
populateQuickFacts()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err)
    process.exit(1)
  })
