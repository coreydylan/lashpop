export interface TeamMember {
  id: number
  name: string
  role: string
  businessName?: string
  image: string
  phone: string
  specialties: string[]
  bio?: string
  quote?: string
  availability?: string
  instagram?: string
  bookingUrl: string
  type: 'employee' | 'independent'
  favoriteServices?: string[]
  funFact?: string
  gallery?: string[]
}

export const teamMembers: TeamMember[] = [
  // LashPop Studios Employees
  {
    id: 1,
    name: 'Emily Rogers',
    role: 'Owner & Lash Artist',
    image: '/lashpop-images/team/emily-rogers.jpeg',
    phone: '760-212-0448',
    specialties: ['Lash Extensions', 'Volume Lashes', 'Classic Lashes', 'Business Management'],
    bio: 'As the founder and owner of LashPop Studios, Emily has built a sanctuary for beauty and wellness in North County. With years of experience and a passion for making every client feel their best, she leads by example with her gentle touch and artistic precision.',
    quote: 'Every client deserves to wake up feeling beautiful and confident.',
    availability: 'By appointment',
    instagram: '@lashpopstudios',
    bookingUrl: 'https://www.vagaro.com/lashpop32',
    type: 'employee',
    favoriteServices: ['Volume Extensions', 'Hybrid Lashes'],
    funFact: 'Emily started LashPop Studios from her home and grew it into the premier lash destination in North County.'
  },
  {
    id: 2,
    name: 'Rachel Edwards',
    role: 'Lash Artist',
    image: '/lashpop-images/team/rachel-edwards.jpeg',
    phone: '760-212-0448',
    specialties: ['Hybrid Extensions', 'Color Lashes', 'Creative Styling'],
    bio: 'Rachel brings creativity and innovation to every lash set. Known for her artistic flair and attention to detail, she\'s the go-to artist for clients wanting something unique or trendy.',
    quote: 'Lashes are my canvas, and every client is a masterpiece.',
    availability: 'Tuesday - Saturday',
    instagram: '@indigomoon.beauty',
    bookingUrl: 'https://www.vagaro.com/lashpop32',
    type: 'employee',
    favoriteServices: ['Hybrid Extensions', 'Colored Lashes'],
    funFact: 'Rachel loves incorporating subtle pops of color into lash sets for a unique twist.'
  },
  {
    id: 3,
    name: 'Ryann Alcorn',
    role: 'Lash Artist',
    image: '/lashpop-images/team/ryann-alcorn.png',
    phone: '760-212-0448',
    specialties: ['Classic Extensions', 'Natural Styling', 'Sensitive Eyes'],
    bio: 'Ryann\'s gentle approach and meticulous attention to detail make her perfect for first-timers and those with sensitive eyes. She believes in enhancing natural beauty, not masking it.',
    quote: 'The best compliment is when people ask if those are your real lashes.',
    availability: 'Monday - Friday',
    instagram: '@ryannsbeauty',
    bookingUrl: 'https://www.vagaro.com/lashpop32',
    type: 'employee',
    favoriteServices: ['Classic Lashes', 'Natural Volume'],
    funFact: 'Ryann specializes in creating the most natural-looking lash extensions that seamlessly blend with your own lashes.'
  },

  // Independent Beauty Professionals
  {
    id: 4,
    name: 'Ashley Petersen',
    role: 'HydraFacial Specialist & Lash Artist',
    businessName: 'Integrated Body and Beauty',
    image: '/lashpop-images/team/ashley-petersen.jpg',
    phone: '760-822-0255',
    specialties: ['HydraFacials', 'Lash Extensions', 'Skin Care', 'Wellness'],
    bio: 'Ashley combines beauty and wellness through her integrated approach. Specializing in HydraFacials and lash artistry, she helps clients achieve radiant skin and stunning lashes.',
    quote: 'Beauty starts with healthy skin.',
    availability: 'By appointment',
    instagram: '@integratedbodyandbeauty',
    bookingUrl: 'https://www.vagaro.com/lashpop32',
    type: 'independent',
    favoriteServices: ['HydraFacial', 'Lash Extensions'],
    funFact: 'Ashley believes in a holistic approach to beauty, combining skincare with lash services for complete facial harmony.'
  },
  {
    id: 5,
    name: 'Ava Mata',
    role: 'Lash Artist',
    businessName: 'Looks and Lashes',
    image: '/lashpop-images/team/ava-mata.jpg',
    phone: '714-336-4908',
    specialties: ['Volume Extensions', 'Classic Lashes', 'Lash Styling'],
    bio: 'Ava\'s expertise in both classic and volume techniques allows her to create customized looks that perfectly complement each client\'s unique features and lifestyle.',
    quote: 'Your lashes should be as unique as you are.',
    availability: 'Wednesday - Sunday',
    instagram: '@__looksandlashes__',
    bookingUrl: 'https://www.vagaro.com/lashpop32',
    type: 'independent',
    favoriteServices: ['Volume Lashes', 'Custom Styling'],
    funFact: 'Ava loves creating dramatic volume sets that still feel lightweight and comfortable.'
  },
  {
    id: 6,
    name: 'Savannah Scherer',
    role: 'Lash Artist & Esthetician',
    businessName: 'San Diego Lash',
    image: '/lashpop-images/team/savannah-scherer.jpeg',
    phone: '619-735-1237',
    specialties: ['Lash Extensions', 'Brow Services', 'Facials', 'Skin Care'],
    bio: 'Savannah offers a complete beauty experience with her expertise in lashes, brows, and skincare. Her holistic approach ensures clients leave feeling refreshed and beautiful.',
    quote: 'Beauty is about feeling good in your own skin.',
    availability: 'Tuesday - Saturday',
    instagram: '@sandiegolash',
    bookingUrl: 'https://www.vagaro.com/lashpop32',
    type: 'independent',
    favoriteServices: ['Lash Extensions', 'Brow Lamination', 'Facials'],
    funFact: 'Savannah can create the perfect brow shape to complement any lash style.'
  },
  {
    id: 7,
    name: 'Elena Castellanos',
    role: 'Plasma Specialist',
    businessName: 'Nuskin Fibroblast',
    image: '/lashpop-images/team/elena-castellanos.jpeg',
    phone: '760-583-3357',
    specialties: ['Jet Plasma', 'Fibroblast', 'Skin Tightening', 'Anti-Aging'],
    bio: 'Elena specializes in advanced plasma treatments for skin rejuvenation. Her non-invasive techniques help clients achieve younger-looking skin without surgery.',
    quote: 'Advanced technology meets natural beauty.',
    availability: 'By appointment',
    instagram: '@nuskin_fibroblast',
    bookingUrl: 'https://www.vagaro.com/lashpop32',
    type: 'independent',
    favoriteServices: ['Jet Plasma', 'Fibroblast Treatment'],
    funFact: 'Elena\'s plasma treatments can achieve results similar to surgical procedures without the downtime.'
  },
  {
    id: 8,
    name: 'Adrianna Arnaud',
    role: 'Lash Artist',
    businessName: 'Lashed by Adrianna',
    image: '/lashpop-images/team/adrianna-arnaud.jpg',
    phone: '760-964-7235',
    specialties: ['Volume Extensions', 'Mega Volume', 'Wispy Lashes'],
    bio: 'Adrianna is known for her stunning volume sets and ability to create wispy, textured looks. Her attention to detail ensures every lash is perfectly placed.',
    quote: 'Volume should be dramatic yet elegant.',
    availability: 'Monday - Friday',
    instagram: '@lashedbyadrianna',
    bookingUrl: 'https://www.vagaro.com/lashpop32',
    type: 'independent',
    favoriteServices: ['Mega Volume', 'Wispy Sets'],
    funFact: 'Adrianna can create volume fans with up to 10 lashes for the ultimate dramatic look.'
  },
  {
    id: 9,
    name: 'Kelly Katona',
    role: 'Lash Artist',
    businessName: 'Lashes by Kelly Katona',
    image: '/lashpop-images/team/kelly-katona.jpeg',
    phone: '760-805-6072',
    specialties: ['Classic Extensions', 'Hybrid Lashes', 'Natural Looks'],
    bio: 'Kelly\'s expertise lies in creating beautiful, natural-looking lash extensions that enhance without overwhelming. Perfect for those seeking subtle elegance.',
    quote: 'Enhance, don\'t disguise.',
    availability: 'Tuesday - Saturday',
    instagram: '@lashesbykellykatona',
    bookingUrl: 'https://www.vagaro.com/lashpop32',
    type: 'independent',
    favoriteServices: ['Classic Sets', 'Natural Hybrid'],
    funFact: 'Kelly specializes in lash sets that look so natural, people think they\'re your real lashes.'
  },
  {
    id: 10,
    name: 'Bethany Peterson',
    role: 'Lash Artist',
    businessName: 'Salty Lash',
    image: '/lashpop-images/team/bethany-peterson.jpeg',
    phone: '760-703-4162',
    specialties: ['Beach Waves Lashes', 'Volume Extensions', 'Textured Sets'],
    bio: 'Bethany brings a coastal vibe to lash artistry with her signature "beach wave" lash sets. Her textured, effortless styles are perfect for the California lifestyle.',
    quote: 'Effortless beauty, beach vibes always.',
    availability: 'Wednesday - Sunday',
    instagram: '@salty.lash',
    bookingUrl: 'https://www.vagaro.com/lashpop32',
    type: 'independent',
    favoriteServices: ['Beach Wave Lashes', 'Textured Volume'],
    funFact: 'Bethany created the signature "Salty Lash" look inspired by California beach culture.'
  },
  {
    id: 11,
    name: 'Grace Ramos',
    role: 'Nurse Injector',
    businessName: 'Naturtox',
    image: '/lashpop-images/team/grace-ramos.jpg',
    phone: '760-525-8628',
    specialties: ['Botox', 'Dermal Fillers', 'Lip Enhancement', 'Facial Contouring'],
    bio: 'Grace brings medical expertise to aesthetic enhancement. As a certified nurse injector, she specializes in natural-looking results with Botox and dermal fillers.',
    quote: 'Subtle enhancements, natural results.',
    availability: 'By appointment',
    instagram: '@natur_tox',
    bookingUrl: 'https://www.vagaro.com/us02/naturtoxnursinginc',
    type: 'independent',
    favoriteServices: ['Botox', 'Lip Fillers'],
    funFact: 'Grace has a gentle injection technique that minimizes discomfort and bruising.'
  },
  {
    id: 12,
    name: 'Renee Belton',
    role: 'Brow Specialist',
    businessName: 'Brows by Cat Black',
    image: '/lashpop-images/team/renee-belton.jpg',
    phone: '760-579-1309',
    specialties: ['Microblading', 'Brow Lamination', 'Lash Lifts', 'Brow Design'],
    bio: 'Renee is our brow architect, creating perfect frames for your face. Her expertise in microblading and brow lamination helps clients achieve their dream brows.',
    quote: 'Great brows don\'t happen by chance, they happen by appointment.',
    availability: 'Monday - Saturday',
    instagram: '@browsbycatblack',
    bookingUrl: 'https://www.vagaro.com/lashpop32',
    type: 'independent',
    favoriteServices: ['Microblading', 'Brow Lamination'],
    funFact: 'Renee can create hair-like strokes so realistic, no one can tell they\'re not natural.'
  },
  {
    id: 13,
    name: 'Evie Ells',
    role: 'Lash Artist & Brow Specialist',
    businessName: 'Evie Ells Aesthetics',
    image: '/lashpop-images/team/evie-ells.jpg',
    phone: '949-866-2206',
    specialties: ['Lash Extensions', 'Brow Services', 'Combination Treatments'],
    bio: 'Evie offers the perfect combination of lash and brow services, ensuring your eye area looks cohesive and beautiful. Her balanced approach creates harmony in facial features.',
    quote: 'It\'s all about balance and proportion.',
    availability: 'Tuesday - Friday',
    instagram: '@evieellsaesthetics',
    bookingUrl: 'https://www.vagaro.com/lashpop32',
    type: 'independent',
    favoriteServices: ['Lash & Brow Packages', 'Combination Services'],
    funFact: 'Evie can match your lash and brow services to create the perfect coordinated look.'
  },
  {
    id: 14,
    name: 'Haley Walker',
    role: 'Esthetician & Lash Artist',
    businessName: 'Lashes by Haley',
    image: '/lashpop-images/team/haley-walker.jpg',
    phone: '760-519-4641',
    specialties: ['Lash Extensions', 'Brow Services', 'Skincare', 'Esthetics'],
    bio: 'Haley combines her esthetics background with lash artistry to provide comprehensive beauty services. Her understanding of skin and facial structure creates optimal results.',
    quote: 'Healthy skin is the best foundation for beautiful lashes.',
    availability: 'Monday - Thursday',
    instagram: '@haley.the.esti',
    bookingUrl: 'https://www.vagaro.com/lashpop32',
    type: 'independent',
    favoriteServices: ['Lash Extensions', 'Facial Treatments'],
    funFact: 'Haley always includes a mini facial with her lash appointments for the ultimate pampering experience.'
  }
]

export const teamValues = [
  {
    title: 'Our Collective Model',
    description: 'We bring together employees and independent beauty professionals, all hand-picked for their expertise and commitment to excellence.',
    icon: 'users'
  },
  {
    title: 'Consistent Excellence',
    description: 'Whether you book with an employee or independent artist, expect the same high standards of service, hygiene, and artistry.',
    icon: 'award'
  },
  {
    title: 'Continuous Education',
    description: 'All our artists regularly attend advanced training to stay at the forefront of beauty trends and techniques.',
    icon: 'graduation-cap'
  },
  {
    title: 'Personalized Experience',
    description: 'Every service is customized to your unique features, lifestyle, and beauty goals.',
    icon: 'heart'
  }
]

export const collectiveModelExplanation = {
  title: 'The LashPop Collective',
  subtitle: 'A Unique Beauty Community',
  description: `At LashPop Studios, we've created something special: a collective of passionate beauty professionals. Our model brings together both studio employees and carefully selected independent artists, each bringing their unique talents and specialties to our space.`,
  points: [
    {
      title: 'Hand-Picked Excellence',
      description: 'Every artist in our collective is personally selected for their skill, professionalism, and alignment with our values.'
    },
    {
      title: 'Diverse Expertise',
      description: 'From lashes to brows, skincare to injectables, our collective offers comprehensive beauty services under one roof.'
    },
    {
      title: 'Consistent Standards',
      description: 'All artists adhere to our strict hygiene protocols, customer service standards, and commitment to excellence.'
    },
    {
      title: 'Supporting Small Businesses',
      description: 'Our independent artists are entrepreneurs building their own beauty businesses within our supportive community.'
    }
  ]
}