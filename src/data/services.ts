export const services = [
  {
    id: 'classic',
    title: 'The Classic Ritual',
    subtitle: 'Your natural beauty, elevated',
    description: 'A meditation in precision. Your artist applies individual extensions with intentional care, creating length that feels born, not built. Perfect for those who believe the best beauty whispers rather than shouts.',
    features: [
      'One extension per natural lash',
      'Soft, natural enhancement',
      '60-90 minute sanctuary session',
      'Lasts 2-3 weeks with proper care'
    ],
    duration: '60-90 min',
    price: 'from $120',
    image: '/lashpop-images/services/classic-lash.png',
    gradient: 'from-[rgba(255,248,243,0.8)] to-[rgba(255,192,203,0.3)]',
    popular: false
  },
  {
    id: 'hybrid',
    title: 'The Hybrid Experience',
    subtitle: 'The perfect balance',
    description: 'Where classic meets volume in perfect harmony. A thoughtful blend that adds just enough drama for those special glances, while maintaining that "are those your real lashes?" intrigue.',
    features: [
      'Mix of classic and volume techniques',
      'Fuller, more textured look',
      '90-120 minute transformative experience',
      'The sweet spot of enhancement'
    ],
    duration: '90-120 min',
    price: 'from $150',
    image: '/lashpop-images/services/hybrid-lash.png',
    gradient: 'from-[rgba(232,180,184,0.3)] to-[rgba(255,248,243,0.8)]',
    popular: true
  },
  {
    id: 'volume',
    title: 'The Volume Journey',
    subtitle: 'Dramatic yet weightless',
    description: 'Multiple ultra-fine extensions fan across each lash, creating clouds of softness that somehow feel lighter than air. For those ready to embrace their most confident, camera-ready self.',
    features: [
      '3-6 ultra-light extensions per lash',
      'Dramatic fullness, feather-light feel',
      '120-150 minute artistic session',
      'Instagram-worthy from every angle'
    ],
    duration: '120-150 min',
    price: 'from $180',
    image: '/lashpop-images/services/volume-lash.png',
    gradient: 'from-[rgba(255,192,203,0.3)] to-[rgba(232,237,231,0.5)]',
    popular: false
  },
  {
    id: 'lift',
    title: 'Lash Lift & Tint',
    subtitle: 'Your lashes, awakened',
    description: 'A gentle curl that opens your eyes like morning light through curtains. Paired with custom tinting, this treatment reveals lashes you didn\'t know you had. No extensions, just elevation.',
    features: [
      'Natural lash enhancement',
      'Semi-permanent curl and color',
      '45-minute gentle treatment',
      'Perfect for minimalists'
    ],
    duration: '45 min',
    price: 'from $85',
    image: '/lashpop-images/services/lash-lift.png',
    gradient: 'from-[rgba(232,237,231,0.3)] to-[rgba(255,192,203,0.3)]',
    popular: false
  },
  {
    id: 'brows',
    title: 'Brow Artistry',
    subtitle: 'Frame your story',
    description: 'Because your brows are the architecture of your face. Whether it\'s lamination for that perfectly brushed look, tinting for definition, or shaping for structure—we create frames worthy of your masterpiece.',
    features: [
      'Lamination, tinting, or shaping',
      'Customized to your features',
      '30-60 minute precision work',
      'The finishing touch'
    ],
    duration: '30-60 min',
    price: 'from $45',
    image: '/lashpop-images/services/brow-photo.png',
    gradient: 'from-[rgba(255,248,243,0.8)] to-[rgba(232,180,184,0.3)]',
    popular: false
  }
]

export const serviceCategories = {
  extensions: ['classic', 'hybrid', 'volume'],
  treatments: ['lift', 'brows']
}

export const addOnServices = [
  {
    name: 'Lower Lash Enhancement',
    price: '$25',
    description: 'Subtle definition for your lower lash line'
  },
  {
    name: 'Lash Removal',
    price: '$30',
    description: 'Gentle, professional removal when you need a fresh start'
  },
  {
    name: 'Color Lashes',
    price: '$15',
    description: 'Add pops of color for special occasions'
  }
]