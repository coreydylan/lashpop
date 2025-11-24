import "dotenv/config"
import { db } from "@/db"
import { teamMembers } from "@/db/schema/team_members"
import { eq } from "drizzle-orm"

// Complete team member data including those that might be missing
const allTeamMembers = [
  // LashPop Employees
  {
    name: "Emily Rogers",
    role: "Owner & Lash Artist",
    type: "employee" as const,
    phone: "760-212-0448",
    email: "",
    instagram: "@lashpopstudios",
    businessName: null,
    bio: `Owner of LashPop with 10 years in the beauty industry. Specializes in natural wispy brown lash extensions. Loves helping women of all ages and stages of life feel naturally beautiful and confident without ever feeling overdone. Also loves creating a peaceful and beautiful studio atmosphere that both clients and team love being in. On days off, enjoys being cozy at home, reading, baking, crafting, playing piano (basically an 80 year old at heart). Fun fact: Originally started LashPop as a side hustle while pursuing a singing career. Favorite movie: You've Got Mail. TV: Schitt's Creek. Go-to drinks: Iced cinnamon honey latte or a spicy margarita.`,
    specialties: ["Lash Extensions", "Natural wispy brown lash extensions"],
    favoriteServices: ["Natural wispy brown lash extensions"],
    funFact: "Originally started LashPop as a side hustle while pursuing a singing career",
    bookingUrl: "https://www.vagaro.com/lashpop32",
    usesLashpopBooking: true,
    imageUrl: "/lashpop-images/team/emily-rogers.jpeg",
    quote: "Every client deserves to wake up feeling beautiful and confident"
  },
  {
    name: "Rachel Edwards",
    role: "Lash Artist",
    type: "employee" as const,
    phone: "760-212-0448",
    email: "",
    instagram: "@indigomoon.beauty",
    businessName: null,
    bio: `LashPop employee with 9 years in the beauty industry. Specializes in lash extensions, particularly classic lash extensions - they're classic for a reason, you can't go wrong with them! Loves the people this work allows her to meet and the connections made with them. Enjoys spending days off at the park with family. Fun fact: She sings! Has performed in musicals since childhood and had a voice coach. Favorite movie: Ella Enchanted. Go-to coffee: Large Protein coffee from Dutch Bros!`,
    specialties: ["Lash extensions", "Classic lash extensions"],
    favoriteServices: ["Classic lash extensions"],
    funFact: "She sings! Has performed in musicals since childhood and had a voice coach",
    bookingUrl: "https://www.vagaro.com/lashpop32",
    usesLashpopBooking: true,
    imageUrl: "/lashpop-images/team/rachel-edwards.jpeg",
    quote: "Lashes are my canvas, and every client is a masterpiece"
  },
  {
    name: "Ryann Alcorn",
    role: "Lash Artist",
    type: "employee" as const,
    phone: "760-212-0448",
    email: "",
    instagram: "@ryannsbeauty",
    businessName: null,
    bio: `LashPop employee with 3 years in the beauty industry, but has been in love with all things beauty since she can remember! Favorite services are wispy wet sets or volume sets of lash extensions. The best part of working in this industry is helping people feel truly confident and comfortable in their own skin. On days off, you can find her discovering new coffee shops, hanging out at the beach, or hammocking somewhere with a pretty view! Fun fact: Also a hair stylist and makeup artist! Favorite TV show: New Girl. Go-to drink: Iced vanilla matcha.`,
    specialties: ["Lash extensions", "Wispy wet sets", "Volume sets"],
    favoriteServices: ["Wispy wet set", "Volume set lash extensions"],
    funFact: "Also a hair stylist and makeup artist",
    bookingUrl: "https://www.vagaro.com/lashpop32",
    usesLashpopBooking: true,
    imageUrl: "/lashpop-images/team/ryann-alcorn.png",
    quote: "The best compliment is when people ask if those are your real lashes"
  },

  // Independent Professionals
  {
    name: "Grace Ramos",
    role: "Nurse Injector",
    type: "independent" as const,
    phone: "760-525-8628",
    email: "",
    instagram: "@natur_tox",
    businessName: "NaturTox",
    bio: `Working in the medical field since 2015, started NaturTox in 2024 expanding skills into aesthetics. Specializes in Botox injections and liquid IVs. Loves injections that make clients feel confident in their own skin - forehead and between eyes are favorites for satisfying results, but the secret weapon is lower face for a snatched jawline. Most loves genuinely connecting with each client - every appointment is more than a treatment, it's a relationship and chance to help someone feel more confident. On days off: slow mornings with kids and husband's homemade coffee (heavy cream, honey, vanilla), strength training outside, beach/park with kids, and family meals. Fun fact: Also a Certified Nurse Midwife catching babies when not doing injections! Favorite movies: Forrest Gump and LOTR: Return of the King.`,
    specialties: ["Botox", "Liquid IVs", "Dermal Fillers", "Facial Contouring"],
    favoriteServices: ["Botox injections", "Liquid IVs", "Forehead injections", "Lower face contouring"],
    funFact: "Also a Certified Nurse Midwife catching babies when not doing injections",
    bookingUrl: "https://www.vagaro.com/us02/naturtoxnursinginc",
    usesLashpopBooking: false,
    imageUrl: "/lashpop-images/team/grace-ramos.jpg",
    quote: "Subtle enhancements, natural results"
  },
  {
    name: "Savannah Scherer",
    role: "Lash Artist & Esthetician",
    type: "independent" as const,
    phone: "619-735-1237",
    email: "",
    instagram: "@sandiegolash",
    businessName: "San Diego Lash",
    bio: `8 years in the beauty industry. Specializes in lash extensions, facials, and brows. Favorite service is facials because she enjoys the relaxation aspect and helping clients with their skincare goals. Loves being able to connect with a variety of different people - it's been a blessing being part of many people's lives throughout the years. Days off are spent at the beach with a good book and snacks from Seaside Market. Go-to drinks: Iced matcha latte with oat milk made at home or iced Mexican mocha from Black Rock.`,
    specialties: ["Lash Extensions", "Facials", "Brows", "Skin Care"],
    favoriteServices: ["Facials", "Lash extensions", "Brow services"],
    funFact: "Perfect beach day includes a good book and snacks from Seaside Market",
    bookingUrl: "https://www.vagaro.com/lashpop32",
    usesLashpopBooking: true,
    imageUrl: "/lashpop-images/team/savannah-scherer.jpeg",
    quote: "Beauty is about feeling good in your own skin"
  },
  {
    name: "Evie Ells",
    role: "Lash Artist & Brow Specialist",
    type: "independent" as const,
    phone: "949-866-2206",
    email: "",
    instagram: "@evieellsaesthetics",
    businessName: "Evie Ells Aesthetics",
    bio: `4.5 years in the beauty industry. Specializes in eyelash extensions and brows. Enjoys the creative and artistic aspect of lashing but loves seeing clients' faces light up when they see their results. It's amazing to help people feel more confident and beautiful, even in a subtle way. Days off start at hot yoga with husband, then anything outside in the sun, ending with Bravo TV, cats, and good red wine! Fun fact: She's a triplet! Favorite movie: How to Lose a Guy in 10 Days (really any Rom-Com with Matthew McConaughey). Go-to coffee: Extra Hot Triple americano splash of almond milk.`,
    specialties: ["Eyelash extensions", "Brow services"],
    favoriteServices: ["Eyelash extensions", "Brow services"],
    funFact: "She's a triplet!",
    bookingUrl: "https://www.vagaro.com/lashpop32",
    usesLashpopBooking: true,
    imageUrl: "/lashpop-images/team/evie-ells.jpg",
    quote: "It's all about balance and proportion"
  },
  {
    name: "Ashley Petersen",
    role: "HydraFacial Specialist & Lash Artist",
    type: "independent" as const,
    phone: "760-822-0255",
    email: "",
    instagram: "@integratedbodyandbeauty",
    businessName: "Integrated Body and Beauty",
    bio: `8 years in the beauty industry. Specializes in hydra-facials, lash extensions, and brow laminations/tints. Loves the dermaplane and hydrafacial combination for the amazing after glow. Most loves enhancing natural beauty and providing ultimate skin health to amazing clientele. Days off include self-care treatments (sauna, cold plunge, red light therapy, sound baths, massage, chiropractic) or being outdoors in nature hiking or at the beach with her cutie 2 year old. Fun fact: Loves to play tennis and run half marathons in National Parks. Favorite movie: The Notebook. Go-to coffee: Vanilla latte.`,
    specialties: ["HydraFacials", "Lash Extensions", "Brow Laminations", "Dermaplaning"],
    favoriteServices: ["Dermaplane and hydrafacial combination", "Lash extensions", "Brow laminations"],
    funFact: "Loves to play tennis and run half marathons in National Parks",
    bookingUrl: "https://www.vagaro.com/lashpop32",
    usesLashpopBooking: true,
    imageUrl: "/lashpop-images/team/ashley-petersen.jpg",
    quote: "Beauty starts with healthy skin"
  },
  {
    name: "Kelly R",
    role: "Permanent Makeup Artist",
    type: "independent" as const,
    phone: "760-212-0448", // Using studio number as placeholder
    email: "",
    instagram: "@kismet.skin",
    businessName: "Kismet",
    bio: `Specializes in permanent makeup (microblading, nano brows, lip blushing), lash extensions, brow laminations/tints, lash lifts, and all waxing services. Favorite service is microblading - got it done herself and it made her feel beautiful and confident, loves giving that to others! Truly loves seeing how happy clients are when they look in the mirror after service. "Little" things like lashes or brows can really boost confidence and beauty. Days off are spent outside - beach walks, hikes with boyfriend and dog, NO phone! Fun fact/favorite movie: The Nightmare Before Christmas - grew up watching it every Halloween/Christmas and could recite it word for word! Go-to coffee: Iced vanilla latte - basic but always good!`,
    specialties: ["Microblading", "Nano brows", "Lip blushing", "Lash extensions"],
    favoriteServices: ["Microblading", "Permanent makeup", "Lash extensions"],
    funFact: "Can recite The Nightmare Before Christmas word for word",
    bookingUrl: "https://www.vagaro.com/lashpop32",
    usesLashpopBooking: true,
    imageUrl: "/lashpop-images/team/kelly-r.jpg",
    quote: "Little things like lashes or brows can really boost confidence"
  },
  {
    name: "Bethany Peterson",
    role: "Lash Artist",
    type: "independent" as const,
    phone: "760-703-4162",
    email: "",
    instagram: "@salty.lash",
    businessName: "Salty Lash",
    bio: `Over 10 years in the beauty industry. Specializes in lash extensions and lash lifts. Favorite service is volume lashes - so rewarding - but loves wet looks right now for how they look. Most loves the people she gets to meet, hearing their stories and coming to love them. Days off are spent with family - doesn't have to be anything special, just loves the days they all have home together. Fun fact: Loves musicals! Favorites: Bridgerton and Harry Potter. Go-to drinks: Coffee makes her crazy so matcha or chai lattes.`,
    specialties: ["Volume Extensions", "Wet Look Lashes", "Lash Lifts"],
    favoriteServices: ["Volume lashes", "Wet look lashes", "Lash lifts"],
    funFact: "Loves musicals",
    bookingUrl: "https://www.vagaro.com/lashpop32",
    usesLashpopBooking: true,
    imageUrl: "/lashpop-images/team/bethany-peterson.jpeg",
    quote: "Effortless beauty, beach vibes always"
  },
  {
    name: "Ava Mata",
    role: "Lash Artist",
    type: "independent" as const,
    phone: "714-336-4908",
    email: "",
    instagram: "@_looksandlashes_",
    businessName: "Looks and Lashes",
    bio: `6 years in the beauty industry doing lashes. Favorite service is wet set full sets - loves getting creative with length, texture, and even brown lashes! Absolutely loves and adores the connections made with clients - nothing better than chatting and getting to know amazing women! Plus they leave feeling confident, relaxed, and obsessed with their lashes. Days off include hanging with loved ones, working out, being outside, or shopping! Hidden talent: Decoding custom license plates on streets/freeways - it's like a puzzle! Favorite shows: Yellowstone and Breaking Bad. Go-to coffee: Iced vanilla latte with oat milk.`,
    specialties: ["Volume Extensions", "Wet Sets", "Creative Lash Styling"],
    favoriteServices: ["Wet set full sets", "Creative lash designs with brown lashes"],
    funFact: "Hidden talent: Decoding custom license plates - it's like a puzzle!",
    bookingUrl: "https://www.vagaro.com/lashpop32",
    usesLashpopBooking: true,
    imageUrl: "/lashpop-images/team/ava-mata.jpg",
    quote: "Your lashes should be as unique as you are"
  },
  {
    name: "Kelly Katona",
    role: "Lash Artist",
    type: "independent" as const,
    phone: "760-805-6072",
    email: "",
    instagram: "@lashesbykellykatona",
    businessName: "Lashes by Kelly Katona",
    bio: `3 years in the beauty industry. Specializes in lash extensions and permanent jewelry. Loves the art of creating unique lash looks for each client - specifically hybrid lashes for their customizability. Most loves the confidence lashes inspire - one simple thing that allows clients to see their natural beauty magnified. Also loves the special connections made with clients. Days off: moving body, quality people, matcha, working on business/dreams, good food, sunsets. Fun fact: Used to be in musicals/plays and sing solos - wants to be in them when watching now BUT actually cannot sing, dance, or act! Favorite movie: Pride & Prejudice. Go-to drink: Iced matcha with oat milk.`,
    specialties: ["Hybrid Lashes", "Lash Extensions", "Permanent Jewelry"],
    favoriteServices: ["Hybrid lashes", "Lash extensions", "Permanent jewelry"],
    funFact: "Used to be in musicals/plays and sing solos but actually cannot sing, dance, or act",
    bookingUrl: "https://www.vagaro.com/lashpop32",
    usesLashpopBooking: true,
    imageUrl: "/lashpop-images/team/kelly-katona.jpeg",
    quote: "Enhance, don't disguise"
  },
  {
    name: "Adrianna Arnaud",
    role: "Lash Artist",
    type: "independent" as const,
    phone: "760-964-7235",
    email: "",
    instagram: "@lashedbyadrianna",
    businessName: "Lashed by Adrianna",
    bio: `6 years in the beauty industry. Specializes in lash extensions and lash lifts. Favorite services are lash lifts for their simple yet effective enhancement of natural lashes, and wet set lash extensions for fuller, darker look while maintaining natural appearance. Finds great fulfillment helping clients streamline morning routines and boost confidence. Having experienced the transformative effect of lash extensions herself, it's incredibly rewarding witnessing clients' reactions. Days off are spent with daughter and husband - mommy-and-me classes, parks, zoo, beach, or outdoor community events. Fun fact: First job was at In-N-Out Burger for 8.5 years - still enjoys their food and visits weekly! Enjoys reality TV. Go-to coffee: Nitro cold brew with sweet cream.`,
    specialties: ["Volume Extensions", "Mega Volume", "Lash Lifts", "Wet Sets"],
    favoriteServices: ["Lash lifts", "Wet set lash extensions"],
    funFact: "Worked at In-N-Out Burger for 8.5 years and still visits weekly",
    bookingUrl: "https://www.vagaro.com/lashpop32",
    usesLashpopBooking: true,
    imageUrl: "/lashpop-images/team/adrianna-arnaud.jpg",
    quote: "Volume should be dramatic yet elegant"
  },
  {
    name: "Kim Starnes",
    role: "Esthetician",
    type: "independent" as const,
    phone: "760-212-0448", // Using studio number as placeholder
    email: "",
    instagram: "@revivedbykim",
    businessName: "Revived by Kim",
    bio: `Specializes in facials and dermaplaning. Favorite service is custom facials because each one is unique - loves tailoring every treatment to individual client needs, keeps things interesting and allows creativity while delivering real results. Most loves igniting confidence in clients - something special about helping someone feel good in their own skin. Values genuine connections built with clients over time. Creating a safe, welcoming space for relaxation is incredibly rewarding. Days off depend on weather: sunny means beach or trail hiking, rainy means snuggling up - always with a good book in hand! Go-to coffee: Iced Honey Latte.`,
    specialties: ["Custom Facials", "Dermaplaning", "Skin Care"],
    favoriteServices: ["Custom facials", "Dermaplaning"],
    funFact: "Always has a good book in hand, rain or shine",
    bookingUrl: "https://www.vagaro.com/lashpop32",
    usesLashpopBooking: true,
    imageUrl: "/lashpop-images/team/kim-starnes.jpg",
    quote: "Something special about helping someone feel good in their own skin"
  },
  {
    name: "Nancy",
    role: "Lash Artist",
    type: "independent" as const,
    phone: "760-212-0448", // Using studio number as placeholder
    email: "",
    instagram: "@nancy.voltlash",
    businessName: "Volt Lash",
    bio: `6 years in the beauty industry. Specializes in lash extensions, particularly classic lash extensions. On days off, likes going to the beach, gym, hanging out with kids, and thrifting. Enjoys going to local events and exploring new coffee shops, but loves being a homebody as well. Fun fact: Has a French Bulldog named... Frenchie!`,
    specialties: ["Classic Lash Extensions"],
    favoriteServices: ["Classic lash extensions"],
    funFact: "Has a French Bulldog named Frenchie",
    bookingUrl: "https://www.vagaro.com/lashpop32",
    usesLashpopBooking: true,
    imageUrl: "/lashpop-images/team/nancy.jpg",
    quote: "Classic lashes never go out of style"
  },
  {
    name: "Haley Walker",
    role: "Esthetician & Lash Artist",
    type: "independent" as const,
    phone: "760-519-4641",
    email: "",
    instagram: "@haley.the.esti",
    businessName: "Lashes by Haley",
    bio: `7 years in the beauty industry. Specializes in lash extensions, brow laminations, and waxing. Loves doing light volume lashes! Most loves making people feel comfortable and confident with lash and brow services. Days off are spent outside hiking, chilling in the sun, or with longer stretches off - loves to camp! Go-to coffee: Vanilla latte.`,
    specialties: ["Lash Extensions", "Brow Laminations", "Waxing", "Light Volume"],
    favoriteServices: ["Light volume lashes", "Brow laminations", "Waxing"],
    funFact: "Loves camping on longer stretches off",
    bookingUrl: "https://www.vagaro.com/lashpop32",
    usesLashpopBooking: true,
    imageUrl: "/lashpop-images/team/haley-walker.jpg",
    quote: "Healthy skin is the best foundation for beautiful lashes"
  },
  {
    name: "Renee Belton",
    role: "Brow Specialist",
    type: "independent" as const,
    phone: "760-579-1309",
    email: "",
    instagram: "@browsbycatblack",
    businessName: "Brows by Cat Black",
    bio: `5 years in the beauty industry, licensed for 11 years. Specializes in brow laminations, brow shaping/waxing/tinting, microblading, and facial waxing. Favorite service is brow laminations - such a satisfying treatment with instant beautiful results that transform the brow while looking natural. Loves how it enhances each client's unique brow shape for a fuller, lifted look without heavy makeup or permanent changes. Most loves enhancing natural beauty while helping clients feel confident and providing space to relax and care for themselves. Days off: shopping, relaxing at home with husband and cat, or at the gym. Fun fact: Used to make dream catchers and sell them in shops. Favorite movie: Empire Records. Go-to coffee: Vanilla latte or honey cinnamon latte.`,
    specialties: ["Microblading", "Brow Lamination", "Brow Shaping", "Facial Waxing"],
    favoriteServices: ["Brow laminations", "Microblading", "Brow shaping"],
    funFact: "Used to make dream catchers and sell them in shops",
    bookingUrl: "https://www.vagaro.com/lashpop32",
    usesLashpopBooking: true,
    imageUrl: "/lashpop-images/team/renee-belton.jpg",
    quote: "Great brows don't happen by chance, they happen by appointment"
  },
  {
    name: "Elena Castellanos",
    role: "Plasma Specialist",
    type: "independent" as const,
    phone: "760-583-3357",
    email: "",
    instagram: "@nuskin_fibroblast",
    businessName: "NUSKIN fibroblast",
    bio: `In the beauty industry since 2020. Loves plasma rejuvenation as it's very effective and every skin type with any skin concern benefits from it. Most loves being part of someone's self care routine, building relationships with clients, and offering lasting results in a natural way. Days off are spent with family exploring, reading, eating out, and pampering herself. Fun fact: Loves to sing! Favorite movies: Many, but especially independent movies. Go-to drinks: Soy cappuccino or herbal tea.`,
    specialties: ["Jet Plasma", "Fibroblast", "Plasma Rejuvenation", "Skin Tightening"],
    favoriteServices: ["Plasma rejuvenation", "Fibroblast treatments"],
    funFact: "Loves to sing",
    bookingUrl: "https://www.vagaro.com/lashpop32",
    usesLashpopBooking: true,
    imageUrl: "/lashpop-images/team/elena-castellanos.jpeg",
    quote: "Advanced technology meets natural beauty"
  }
]

async function addOrUpdateTeamMembers() {
  console.log("Starting team member import with bios...")
  let added = 0
  let updated = 0
  let errors = 0

  for (const member of allTeamMembers) {
    try {
      // Check if team member exists
      const existing = await db
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.name, member.name))
        .limit(1)

      if (existing.length > 0) {
        // Update existing member
        await db
          .update(teamMembers)
          .set({
            ...member,
            updatedAt: new Date()
          })
          .where(eq(teamMembers.id, existing[0].id))

        console.log(`✅ Updated: ${member.name}`)
        updated++
      } else {
        // Insert new member
        await db
          .insert(teamMembers)
          .values({
            ...member,
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true,
            displayOrder: "0"
          })

        console.log(`➕ Added: ${member.name}`)
        added++
      }
    } catch (error) {
      console.error(`❌ Error with ${member.name}:`, error)
      errors++
    }
  }

  console.log(`
✨ Import complete!
   Added: ${added}
   Updated: ${updated}
   Errors: ${errors}
`)
}

// Run the import
addOrUpdateTeamMembers().catch(console.error)