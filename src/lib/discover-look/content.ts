// DISCOVER YOUR LOOK AI - Comprehensive Service Content
// This file contains all educational content, discovery pathways, and recommendations

import type { ServiceEducation, CategoryEducation } from './types'

// ============================================================================
// LASHES - Flagship Category with Deep Content
// ============================================================================

export const LASHES_EDUCATION: CategoryEducation = {
  categorySlug: 'lashes',
  categoryName: 'Lashes',

  introduction: `Lash extensions are more than a beauty service - they're a lifestyle upgrade.
Wake up ready, skip the mascara, and feel confident from the moment you open your eyes.`,

  philosophy: `At Lash Pop, we believe your lashes should enhance your natural beauty while
fitting seamlessly into your lifestyle. Every set is customized to complement your eye shape,
face structure, and personal style.`,

  styles: [
    {
      serviceSlug: 'classic-full-set',
      serviceName: 'Classic Lashes',
      categorySlug: 'lashes',
      categoryName: 'Lashes',

      tagline: 'Your lashes, but better',
      philosophy: 'One extension, one natural lash - the art of subtle enhancement',

      idealFor: [
        'First-time lash extension clients',
        'Those who prefer natural, understated beauty',
        'Professionals who need a polished but subtle look',
        'Anyone who wants enhanced length without drama',
        'Those with naturally thick lashes wanting more definition',
      ],

      theLook: `Classic lashes create beautiful length and a subtle curl that opens up your eyes.
Think "did she get lash extensions or is she just blessed?" - that's the classic look.
Natural enough for your grandmother to approve, enhanced enough that you'll never want to go back.`,

      process: `Your lash artist will isolate each natural lash and apply a single extension using
medical-grade adhesive. You'll lie comfortably with your eyes closed for the entire appointment -
many clients fall asleep! The process is completely painless.`,

      duration: '90-120 minutes for a full set',
      maintenance: 'Fills every 2-3 weeks ($75-95)',
      longevity: '4-6 weeks with proper care',
      priceRange: '$150-180 for full set',

      benefits: [
        'Most natural-looking extension style',
        'Lightweight and comfortable',
        'Perfect for everyday wear',
        'Great for sensitive eyes',
        'Lower maintenance than volume styles',
      ],

      preparation: [
        'Arrive with clean, makeup-free eyes',
        'Remove contacts if you wear them',
        'Skip caffeine if you tend to be jittery',
        'No eye creams or oils for 24 hours before',
      ],

      aftercare: [
        'Avoid water for 24-48 hours after application',
        'No oil-based products near eyes',
        'Use a lash brush daily to keep them fluffy',
        'Sleep on your back or side to protect lashes',
        'Clean lashes gently with lash-safe cleanser',
      ],

      faqs: [
        {
          question: 'Will classic lashes damage my natural lashes?',
          answer: 'No! When properly applied by a trained artist, extensions are completely safe. Each extension is isolated to a single natural lash, so your lashes shed naturally as they normally would.',
        },
        {
          question: 'How do I know if classic is right for me?',
          answer: 'Classic is perfect if you want enhancement without drama. If you already have thick natural lashes or prefer a subtle look, classic is your match. If you want more fullness, consider hybrid.',
        },
      ],

      comparisonPoints: {
        fullness: 'Natural enhancement - 1 extension per lash',
        drama: 'Subtle and sophisticated',
        weight: 'Lightest option',
        time: 'Shortest appointment',
        maintenance: 'Easy to maintain',
      },
    },
    {
      serviceSlug: 'hybrid-full-set',
      serviceName: 'Hybrid Lashes',
      categorySlug: 'lashes',
      categoryName: 'Lashes',

      tagline: 'The best of both worlds',
      philosophy: 'Where classic meets volume in perfect harmony - definition with dimension',

      idealFor: [
        'Those wanting more than classic but still natural',
        'Clients who love that "I woke up like this" look',
        'Anyone with gaps in their natural lash line',
        'Those wanting texture and dimension',
        'Perfect for photos and special occasions',
      ],

      theLook: `Hybrid lashes combine classic singles with volume fans for a textured, full look
that still reads as natural. It's the "Instagram filter in real life" effect - your eyes look
bigger, brighter, and more defined without looking obviously done.`,

      process: `Your artist will mix classic one-to-one extensions with handmade volume fans,
strategically placing them to create dimension and fill any sparse areas. The result is
fuller than classic but more natural than full volume.`,

      duration: '2-2.5 hours for a full set',
      maintenance: 'Fills every 2-3 weeks ($85-110)',
      longevity: '4-6 weeks with proper care',
      priceRange: '$180-220 for full set',

      benefits: [
        'Fuller than classic, softer than volume',
        'Covers sparse areas naturally',
        'Creates beautiful dimension',
        'Photographs beautifully',
        'Versatile for any occasion',
      ],

      preparation: [
        'Arrive with clean, makeup-free eyes',
        'Remove contacts if you wear them',
        'Plan for a slightly longer appointment',
        'No eye creams or oils for 24 hours before',
      ],

      aftercare: [
        'Avoid water for 24-48 hours after application',
        'No oil-based products near eyes',
        'Use a lash brush daily to keep them fluffy',
        'Sleep on your back or side to protect lashes',
        'Clean lashes gently with lash-safe cleanser',
      ],

      comparisonPoints: {
        fullness: 'Enhanced fullness - mix of singles and fans',
        drama: 'Noticeable but natural',
        weight: 'Light to medium',
        time: 'Medium appointment length',
        maintenance: 'Moderate maintenance',
      },
    },
    {
      serviceSlug: 'volume-full-set',
      serviceName: 'Volume Lashes',
      categorySlug: 'lashes',
      categoryName: 'Lashes',

      tagline: 'Drama without the weight',
      philosophy: 'Clouds of softness - dramatic fullness with feather-light feel',

      idealFor: [
        'Those who love a full, glamorous look',
        'Anyone wanting camera-ready lashes',
        'Clients with sparse natural lashes',
        'Special occasions and events',
        'Those ready to embrace bold beauty',
      ],

      theLook: `Volume lashes are full, fluffy, and undeniably glamorous. Multiple ultra-fine
extensions are fanned and applied to each natural lash, creating that "lash goal" look you
see on influencers. Full and dramatic, but still softer and more natural than strip lashes.`,

      process: `Your artist hand-creates delicate fans of 3-6 ultra-fine extensions and applies
them to each natural lash. Despite the fullness, the extensions are so fine that they often
weigh less than a single classic extension.`,

      duration: '2.5-3 hours for a full set',
      maintenance: 'Fills every 2-3 weeks ($95-130)',
      longevity: '4-6 weeks with proper care',
      priceRange: '$220-280 for full set',

      benefits: [
        'Maximum fullness and drama',
        'Creates dark, defined lash line',
        'Perfect for photos and events',
        'Can customize from fluffy to dramatic',
        'Surprisingly lightweight',
      ],

      preparation: [
        'Arrive with clean, makeup-free eyes',
        'Remove contacts if you wear them',
        'Plan for a longer appointment - bring headphones!',
        'No eye creams or oils for 24 hours before',
      ],

      aftercare: [
        'Avoid water for 24-48 hours after application',
        'Be extra gentle when cleaning',
        'Use a lash brush daily to keep fans fluffy',
        'Sleep on your back to preserve shape',
        'Avoid rubbing or touching your lashes',
      ],

      comparisonPoints: {
        fullness: 'Maximum fullness - multi-extension fans',
        drama: 'Glamorous and bold',
        weight: 'Light despite fullness',
        time: 'Longest appointment',
        maintenance: 'More detailed care',
      },
    },
    {
      serviceSlug: 'wet-angel-full-set',
      serviceName: 'Wet/Angel Lashes',
      categorySlug: 'lashes',
      categoryName: 'Lashes',

      tagline: 'Editorial edge, everyday wearable',
      philosophy: 'Textured glamour - the spiked, glossy, runway-ready effect',

      idealFor: [
        'Fashion-forward clients',
        'Those who love editorial and runway looks',
        'Anyone wanting something unique and eye-catching',
        'Those who love the wet, just-out-of-pool look',
        'Clients who appreciate artistry and trends',
      ],

      theLook: `Wet lashes (also called angel or wispy lashes) have that just-stepped-out-of-the-ocean
glossiness with intentional spike and texture. Think high fashion editorial meets beachy California vibes.
Spiky, textured, and absolutely stunning.`,

      process: `Your artist creates this look by combining closed fans and spikes strategically
placed to create that wet, separated appearance. It's a technical style that requires an
artistic eye for placement and proportion.`,

      duration: '2.5-3 hours for a full set',
      maintenance: 'Fills every 2-3 weeks ($95-130)',
      longevity: '4-6 weeks with proper care',
      priceRange: '$220-280 for full set',

      benefits: [
        'Unique, fashion-forward look',
        'Creates stunning eye shape',
        'Perfect for photos',
        'Makes a statement',
        'Trending and modern',
      ],

      preparation: [
        'Arrive with clean, makeup-free eyes',
        'Have reference photos ready if possible',
        'Plan for a longer appointment',
        'No eye creams or oils for 24 hours before',
      ],

      aftercare: [
        'Avoid water for 24-48 hours after application',
        'Brush carefully to maintain spike pattern',
        'Sleep on your back to preserve texture',
        'Avoid rubbing or pressing on lashes',
        'Gentle cleansing to keep spikes defined',
      ],

      comparisonPoints: {
        fullness: 'Textured fullness with intentional gaps',
        drama: 'Editorial and trendy',
        weight: 'Light to medium',
        time: 'Longer appointment for artistry',
        maintenance: 'Careful brushing required',
      },
    },
    {
      serviceSlug: 'lash-lift-tint',
      serviceName: 'Lash Lift & Tint',
      categorySlug: 'lashes',
      categoryName: 'Lashes',

      tagline: 'Enhance what you have',
      philosophy: 'Natural beauty amplified - no extensions needed',

      idealFor: [
        'Those who prefer a natural, low-maintenance look',
        'Anyone with naturally long lashes that point down',
        'Clients who want to skip mascara forever',
        'Those not ready for extensions',
        'Athletes and active lifestyles',
      ],

      theLook: `A lash lift curls your natural lashes from the root, making your eyes look
wide awake and bright. Add a tint, and you've got the look of mascara without ever picking
up a wand. It's the "effortless beauty" of your dreams.`,

      process: `Your natural lashes are lifted onto a silicone shield and treated with a gentle
perming solution that sets the curl. A tint is then applied to darken the lashes. The whole
process is relaxing - many clients nap through it!`,

      duration: '45-60 minutes',
      maintenance: 'None! Just repeat every 6-8 weeks',
      longevity: '6-8 weeks',
      priceRange: '$85-120',

      benefits: [
        'Zero daily maintenance',
        'Natural-looking results',
        'No damage to natural lashes',
        'Perfect for active lifestyles',
        'Wake up ready to go',
      ],

      preparation: [
        'Arrive with clean, makeup-free eyes',
        'Remove contacts if you wear them',
        'No lash curling for 24 hours before',
        'No mascara or eye makeup',
      ],

      aftercare: [
        'Avoid water for 24 hours',
        'No mascara for 24 hours',
        'Avoid rubbing eyes',
        'Use lash serum to keep lashes healthy',
        'Avoid oil-based products around eyes',
      ],

      comparisonPoints: {
        fullness: 'Your natural lashes, enhanced',
        drama: 'Subtle and natural',
        weight: 'None - it\'s your own lashes!',
        time: 'Quick appointment',
        maintenance: 'Virtually none',
      },
    },
  ],

  discoveryQuestions: [
    {
      question: 'What kind of look are you going for?',
      options: [
        { label: 'Natural and subtle', leadsTo: 'classic-full-set', matchesStyle: ['classic', 'lash-lift'] },
        { label: 'Full but still natural', leadsTo: 'hybrid-full-set', matchesStyle: ['hybrid'] },
        { label: 'Glamorous and dramatic', leadsTo: 'volume-full-set', matchesStyle: ['volume', 'mega-volume'] },
        { label: 'Fashion-forward and trendy', leadsTo: 'wet-angel-full-set', matchesStyle: ['wet-angel', 'wispy'] },
        { label: 'Just enhance what I have', leadsTo: 'lash-lift-tint', matchesStyle: ['lash-lift'] },
      ],
    },
    {
      question: 'How much time can you dedicate to lash maintenance?',
      options: [
        { label: 'Minimal - less is more', leadsTo: 'lash-lift-tint', matchesStyle: ['lash-lift', 'classic'] },
        { label: 'Happy to get fills regularly', leadsTo: 'style-preference', matchesStyle: ['classic', 'hybrid', 'volume'] },
        { label: 'Whatever it takes for the look I want', leadsTo: 'style-preference', matchesStyle: ['volume', 'mega-volume', 'wet-angel'] },
      ],
    },
    {
      question: 'Have you had lash extensions before?',
      options: [
        { label: 'Nope, first time!', leadsTo: 'education', matchesStyle: ['classic', 'hybrid'] },
        { label: 'Yes, and I loved them', leadsTo: 'style-preference', matchesStyle: [] },
        { label: 'Yes, but I want to try something different', leadsTo: 'style-comparison', matchesStyle: [] },
      ],
    },
  ],
}

// ============================================================================
// BROWS - Second Major Category
// ============================================================================

export const BROWS_EDUCATION: CategoryEducation = {
  categorySlug: 'brows',
  categoryName: 'Brows',

  introduction: `Your brows are the architecture of your face - they frame your eyes and
define your expressions. Whether you want to shape, fill, or transform, we've got you covered.`,

  philosophy: `Great brows don't just happen. They're crafted with an understanding of
face shape, bone structure, and personal style. Our brow artists take time to create
the perfect shape for YOUR face.`,

  styles: [
    {
      serviceSlug: 'brow-lamination-tint',
      serviceName: 'Brow Lamination',
      categorySlug: 'brows',
      categoryName: 'Brows',

      tagline: 'The soap brow effect, all day every day',
      philosophy: 'Redirect, reshape, and reveal your best brows',

      idealFor: [
        'Those with unruly or downward-growing brow hairs',
        'Anyone wanting that fluffy, brushed-up look',
        'Clients with good brow hair who want more fullness',
        'Those who spend time on brow gel daily',
        'Anyone who loves the soap brow trend',
      ],

      theLook: `Brow lamination is essentially a perm for your eyebrows. It redirects hairs
to lay flat and uniform, creating that trendy fluffy, feathered look. Your brows will
look fuller and more defined, even without makeup.`,

      process: `A lifting solution is applied to soften the hair structure, allowing us to
brush and set your brows in the desired direction. A neutralizer sets the shape, and we
finish with a nourishing treatment. Add a tint for maximum impact.`,

      duration: '45-60 minutes',
      maintenance: 'None until next treatment',
      longevity: '6-8 weeks',
      priceRange: '$75-100 (add tint for +$15)',

      benefits: [
        'Fuller-looking brows instantly',
        'Covers sparse areas by redirecting hair',
        'No daily styling needed',
        'Works with any brow shape',
        'Can grow brows out while maintaining shape',
      ],

      aftercare: [
        'Avoid getting brows wet for 24 hours',
        'No brow products for 24 hours',
        'Use brow serum to keep hairs healthy',
        'Brush brows up daily to maintain shape',
      ],
    },
    {
      serviceSlug: 'microblading-1st-appointment',
      serviceName: 'Microblading',
      categorySlug: 'brows',
      categoryName: 'Brows',

      tagline: 'Hair-stroke perfection',
      philosophy: 'Semi-permanent art that looks like real hair',

      idealFor: [
        'Those with sparse or thin brows',
        'Anyone with gaps or asymmetry',
        'Those who\'ve overplucked in the past',
        'Clients who want to wake up with perfect brows',
        'Anyone tired of filling in brows daily',
      ],

      theLook: `Microblading creates incredibly natural-looking hair strokes that mimic
real brow hairs. The result is fuller, more defined brows that look like you were
just blessed with great genetics.`,

      process: `Using a handheld tool with tiny needles, your artist creates individual
hair-stroke incisions and deposits pigment. Numbing cream is applied first, so
discomfort is minimal. A touch-up appointment 6-8 weeks later perfects the look.`,

      duration: '2-3 hours (including numbing and consultation)',
      maintenance: 'Touch-up at 6-8 weeks, annual refresh recommended',
      longevity: '1-3 years depending on skin type',
      priceRange: '$400-600 (includes touch-up)',

      benefits: [
        'Most natural-looking semi-permanent brow solution',
        'Wake up with perfect brows every day',
        'Custom color matched to your hair',
        'Fills sparse areas seamlessly',
        'Corrects asymmetry',
      ],

      preparation: [
        'Avoid blood thinners, alcohol, caffeine for 24 hours',
        'No brow waxing or threading for 2 weeks before',
        'Come with a general idea of your desired shape',
        'No retinol or AHA products near brows for 1 week',
      ],

      aftercare: [
        'Keep brows dry for 10 days',
        'Apply healing balm as directed',
        'Avoid sun, sweat, and swimming during healing',
        'Do not pick or scratch healing brows',
        'Expect some fading - this is normal',
      ],
    },
    {
      serviceSlug: 'nanobrows-1st-appointment',
      serviceName: 'Nanobrows',
      categorySlug: 'brows',
      categoryName: 'Brows',

      tagline: 'Ultra-fine precision',
      philosophy: 'Machine precision for the most realistic results',

      idealFor: [
        'Those wanting the most natural-looking results possible',
        'Clients with oily skin (holds better than microblading)',
        'Anyone wanting finer, more delicate strokes',
        'Those who want longevity',
        'Clients who prefer machine work over manual',
      ],

      theLook: `Nanobrows use a digital machine to create even finer hair strokes than
microblading. The result is incredibly realistic - even under close inspection,
the strokes look like real brow hairs.`,

      process: `Similar to microblading, but using a digital machine with an ultra-fine
needle. This allows for more control and finer strokes. Numbing is applied first,
and a touch-up appointment perfects the results.`,

      duration: '2-3 hours (including numbing and consultation)',
      maintenance: 'Touch-up at 6-8 weeks, annual refresh recommended',
      longevity: '2-3 years',
      priceRange: '$500-700 (includes touch-up)',

      benefits: [
        'Finest, most realistic hair strokes',
        'Better for oily skin than microblading',
        'Longer lasting results',
        'Less trauma to the skin',
        'More consistent results',
      ],

      preparation: [
        'Same as microblading',
        'Avoid blood thinners, alcohol, caffeine for 24 hours',
        'No brow treatments for 2 weeks before',
        'No retinol near brows for 1 week',
      ],

      aftercare: [
        'Same as microblading',
        'Keep dry for 10 days',
        'Apply healing balm as directed',
        'Avoid sun and sweat during healing',
      ],
    },
  ],

  discoveryQuestions: [
    {
      question: 'What\'s your current brow situation?',
      options: [
        { label: 'I have good brow hair, just unruly', leadsTo: 'brow-lamination-tint', matchesStyle: ['lamination'] },
        { label: 'Sparse or thin brows', leadsTo: 'semi-permanent-comparison', matchesStyle: ['microblading', 'nanobrows'] },
        { label: 'Overplucked or gaps', leadsTo: 'semi-permanent-comparison', matchesStyle: ['microblading', 'nanobrows'] },
        { label: 'Just need shaping', leadsTo: 'brow-shaping', matchesStyle: ['shaping'] },
      ],
    },
    {
      question: 'How long do you want the results to last?',
      options: [
        { label: 'A few weeks is fine', leadsTo: 'brow-lamination-tint', matchesStyle: ['lamination', 'shaping', 'tint'] },
        { label: 'Semi-permanent (1-3 years)', leadsTo: 'semi-permanent-comparison', matchesStyle: ['microblading', 'nanobrows'] },
      ],
    },
  ],
}

// ============================================================================
// FACIALS
// ============================================================================

export const FACIALS_EDUCATION: CategoryEducation = {
  categorySlug: 'facials',
  categoryName: 'Facials',

  introduction: `Your skin deserves more than just a routine - it deserves a ritual.
Our facial treatments combine advanced technology with relaxing experiences to
give you results you can see and feel.`,

  philosophy: `Every face tells a story, and every skin type has unique needs. Our
estheticians customize each treatment to address your specific concerns while
giving you a truly pampering experience.`,

  styles: [
    {
      serviceSlug: 'customized-hydrafacial',
      serviceName: 'HydraFacial',
      categorySlug: 'facials',
      categoryName: 'Facials',

      tagline: 'The glow everyone asks about',
      philosophy: '3-step vortex technology - cleanse, extract, hydrate',

      idealFor: [
        'Anyone wanting instant glow',
        'All skin types (truly customizable)',
        'Before special events',
        'Those with congested pores',
        'Anyone wanting no-downtime results',
      ],

      theLook: `That lit-from-within glow that makes people ask "what did you do?!"
HydraFacials give you clear, plump, radiant skin immediately. You leave looking
like you just had 8 hours of sleep and drank a gallon of water.`,

      process: `The HydraFacial uses patented Vortex-Fusion technology to cleanse,
extract, and hydrate in three steps. Serums are customized to your skin concerns -
brightening, anti-aging, acne-fighting, or calming.`,

      duration: '30-75 minutes depending on level',
      maintenance: 'Monthly for best results',
      longevity: 'Immediate glow, cumulative results with regular treatments',
      priceRange: '$150-350 depending on level and add-ons',

      benefits: [
        'No downtime - leave glowing',
        'Deep cleaning without irritation',
        'Customizable for any concern',
        'Gentle extraction (no squeezing!)',
        'Instant and long-term results',
      ],
    },
    {
      serviceSlug: 'dermaplaning-facial',
      serviceName: 'Dermaplaning',
      categorySlug: 'facials',
      categoryName: 'Facials',

      tagline: 'Smooth skin, instant radiance',
      philosophy: 'Gentle exfoliation that reveals your best skin',

      idealFor: [
        'Those wanting smoother makeup application',
        'Anyone with peach fuzz concerns',
        'Dull, textured skin',
        'Those wanting product penetration boost',
        'Pre-event glow',
      ],

      theLook: `Silky smooth, luminous skin that reflects light beautifully. Your
makeup will glide on like never before, and your skincare will actually sink in
instead of sitting on top.`,

      process: `Using a sterile surgical blade, your esthetician gently scrapes away
dead skin cells and vellus hair (peach fuzz). It sounds scarier than it is -
most clients find it relaxing.`,

      duration: '30-45 minutes',
      maintenance: 'Every 4-6 weeks',
      longevity: '3-4 weeks',
      priceRange: '$75-100',

      benefits: [
        'Instant smoothness',
        'Removes peach fuzz',
        'Better product absorption',
        'Flawless makeup application',
        'No downtime',
      ],
    },
    {
      serviceSlug: 'celluma-facial',
      serviceName: 'LED Light Therapy (Celluma)',
      categorySlug: 'facials',
      categoryName: 'Facials',

      tagline: 'NASA technology for your skin',
      philosophy: 'Light-powered healing and rejuvenation',

      idealFor: [
        'Acne-prone skin',
        'Those concerned with fine lines',
        'Anyone with inflammation',
        'Post-procedure healing',
        'Those wanting non-invasive anti-aging',
      ],

      theLook: `Calm, clear, rejuvenated skin over time. LED isn't about instant
gratification - it's about deep healing. With consistent treatments, you'll
see reduced acne, improved texture, and fewer fine lines.`,

      process: `You lie comfortably under an LED panel that delivers specific wavelengths
of light. Blue light kills acne bacteria, red light stimulates collagen, and
near-infrared promotes healing. It's completely relaxing.`,

      duration: '30 minutes',
      maintenance: 'Series of 6-12 treatments recommended, then monthly',
      longevity: 'Cumulative with regular treatments',
      priceRange: '$75-100 per session',

      benefits: [
        'Kills acne-causing bacteria',
        'Stimulates collagen production',
        'Reduces inflammation',
        'Speeds healing',
        'No downtime or discomfort',
      ],
    },
  ],

  discoveryQuestions: [
    {
      question: 'What\'s your main skin concern?',
      options: [
        { label: 'Acne and breakouts', leadsTo: 'acne-facials', matchesStyle: ['clarifying-hydrafacial', 'led', 'acne-facial'] },
        { label: 'Fine lines and aging', leadsTo: 'anti-aging-facials', matchesStyle: ['led', 'ultimate-hydrafacial', 'age-gracefully'] },
        { label: 'Dullness and texture', leadsTo: 'glow-facials', matchesStyle: ['hydrafacial', 'dermaplaning', 'oxygen-facial'] },
        { label: 'Dehydration', leadsTo: 'hydrating-facials', matchesStyle: ['hydrafacial', 'customized-facial'] },
        { label: 'Sensitivity and redness', leadsTo: 'calming-facials', matchesStyle: ['soothe-and-calm', 'led'] },
      ],
    },
    {
      question: 'What are you looking for in a facial experience?',
      options: [
        { label: 'Relaxation and pampering', leadsTo: 'signature-facials', matchesStyle: ['signature-facial', 'oasis-facial'] },
        { label: 'Results-focused treatment', leadsTo: 'treatment-facials', matchesStyle: ['hydrafacial', 'led', 'dermaplaning'] },
        { label: 'Both relaxation AND results', leadsTo: 'premium-facials', matchesStyle: ['ultimate-hydrafacial', 'epicutis-facial'] },
      ],
    },
  ],
}

// ============================================================================
// PERMANENT MAKEUP
// ============================================================================

export const PERMANENT_MAKEUP_EDUCATION: CategoryEducation = {
  categorySlug: 'permanent-makeup',
  categoryName: 'Permanent Makeup',

  introduction: `Semi-permanent cosmetic tattooing that saves you time every day.
Wake up with perfect brows, flushed lips, or adorable freckles - no makeup required.`,

  philosophy: `Permanent makeup is an art form. We focus on enhancing your natural
features, not creating an artificial look. Our artists use techniques that heal
naturally and complement your unique beauty.`,

  styles: [
    {
      serviceSlug: 'lip-blushing-1st-appointment',
      serviceName: 'Lip Blushing',
      categorySlug: 'permanent-makeup',
      categoryName: 'Permanent Makeup',

      tagline: 'Your lips, but rosier',
      philosophy: 'Subtle color that enhances your natural beauty',

      idealFor: [
        'Those with pale or uneven lip color',
        'Anyone wanting a defined lip shape',
        'Those who want to look polished without lipstick',
        'Clients wanting that "just bitten" look',
        'Anyone tired of lipstick fading',
      ],

      theLook: `A soft, natural flush of color that enhances your lips. Think of it
as a permanent tint - you'll look like you always have just the right amount of
color, even first thing in the morning.`,

      process: `After numbing, your artist will customize a color that complements
your skin tone and deposits pigment using a machine. The initial color will be
bold but fades to a natural flush during healing.`,

      duration: '2-3 hours',
      maintenance: 'Touch-up at 6-8 weeks, refresh every 1-3 years',
      longevity: '2-5 years depending on lifestyle',
      priceRange: '$400-600 (includes touch-up)',

      benefits: [
        'Wake up with perfect lip color',
        'Corrects asymmetry and uneven color',
        'Saves daily makeup time',
        'Can still wear lipstick over it',
        'Customized to your skin tone',
      ],

      preparation: [
        'Exfoliate lips for a week before',
        'Stay hydrated',
        'No lip treatments for 2 weeks before',
        'No blood thinners or alcohol for 24 hours',
      ],

      aftercare: [
        'Apply healing balm frequently',
        'Avoid water on lips for 7 days',
        'Don\'t pick at peeling',
        'Avoid spicy, salty, and hot foods',
        'Sleep slightly elevated to reduce swelling',
      ],
    },
    {
      serviceSlug: 'faux-freckles-1st-appointment',
      serviceName: 'Faux Freckles',
      categorySlug: 'permanent-makeup',
      categoryName: 'Permanent Makeup',

      tagline: 'Sun-kissed without the sun damage',
      philosophy: 'Hand-placed freckles for that effortless, natural glow',

      idealFor: [
        'Those who love the sun-kissed look',
        'Anyone wanting a youthful, fresh appearance',
        'Those with freckles who want more',
        'Natural beauty lovers',
        'Anyone wanting an instant "I just came from vacation" look',
      ],

      theLook: `Natural-looking freckles scattered across your nose and cheeks
that give you that sun-kissed glow year-round. We customize the pattern and
intensity to look like you were born with them.`,

      process: `Each freckle is individually hand-dotted using a machine, allowing
for complete customization of size, color, and placement. We work with your
natural features to create an authentic look.`,

      duration: '1-2 hours',
      maintenance: 'Touch-up at 6-8 weeks, annual refresh optional',
      longevity: '1-3 years',
      priceRange: '$250-400 (includes touch-up)',

      benefits: [
        'Year-round sun-kissed glow',
        'Completely customizable',
        'Natural-looking results',
        'Quick procedure',
        'No more drawing on freckles daily',
      ],

      preparation: [
        'No spray tans or heavy sun exposure before',
        'Come with clean, makeup-free skin',
        'Avoid blood thinners for 24 hours',
      ],

      aftercare: [
        'Keep area dry for 7 days',
        'Apply healing balm as directed',
        'No picking or scratching',
        'Avoid sun until fully healed',
      ],
    },
  ],

  discoveryQuestions: [
    {
      question: 'What area are you interested in?',
      options: [
        { label: 'Lips - more color and definition', leadsTo: 'lip-blushing', matchesStyle: ['lip-blushing'] },
        { label: 'Brows - permanent shape and fill', leadsTo: 'brows-education', matchesStyle: ['microblading', 'nanobrows'] },
        { label: 'Freckles - sun-kissed look', leadsTo: 'faux-freckles', matchesStyle: ['faux-freckles'] },
        { label: 'Beauty marks - classic Hollywood', leadsTo: 'beauty-marks', matchesStyle: ['beauty-marks'] },
      ],
    },
  ],
}

// ============================================================================
// WAXING (Transactional - Less Discovery-Focused)
// ============================================================================

export const WAXING_EDUCATION: CategoryEducation = {
  categorySlug: 'waxing',
  categoryName: 'Waxing',

  introduction: `Smooth skin, no hassle. Our waxing services use high-quality
wax and proper technique for the best results with minimal discomfort.`,

  philosophy: `Everyone deserves to feel smooth and confident. Our estheticians
are trained to make your waxing experience as comfortable as possible.`,

  styles: [],

  discoveryQuestions: [
    {
      question: 'What area are you looking to wax?',
      options: [
        { label: 'Face (lip, chin, brows)', leadsTo: 'face-waxing', matchesStyle: [] },
        { label: 'Body (brazilian, underarms, legs)', leadsTo: 'body-waxing', matchesStyle: [] },
        { label: 'Full face waxing', leadsTo: 'full-face-wax', matchesStyle: [] },
      ],
    },
  ],
}

// ============================================================================
// SPECIALTY SERVICES
// ============================================================================

export const SPECIALTY_EDUCATION: CategoryEducation = {
  categorySlug: 'specialty',
  categoryName: 'Specialty Services',

  introduction: `Unique offerings that go beyond traditional beauty services.
From permanent jewelry to injectables, we've got something special for everyone.`,

  philosophy: `Beauty comes in many forms. Our specialty services let you
express yourself in unique ways and access premium treatments in a boutique setting.`,

  styles: [
    {
      serviceSlug: 'permanent-jewelry-for-1-3-peoplepieces',
      serviceName: 'Permanent Jewelry',
      categorySlug: 'specialty',
      categoryName: 'Specialty',

      tagline: 'Forever linked',
      philosophy: 'Jewelry that never comes off - a symbol that stays with you',

      idealFor: [
        'Best friends wanting matching bracelets',
        'Couples celebrating their bond',
        'Self-love tokens',
        'Mother-daughter bonding',
        'Bridesmaids and bride groups',
      ],

      theLook: `Delicate chain bracelets, anklets, or necklaces that are welded
closed without a clasp. They become a permanent part of you - elegant,
understated, and meaningful.`,

      process: `Choose your chain style, we size it perfectly to your wrist,
ankle, or neck, then weld it closed with a quick, painless zap. The whole
process takes just minutes.`,

      duration: '15-30 minutes',
      maintenance: 'None - it\'s permanent!',
      longevity: 'Forever (until you cut it off)',
      priceRange: '$50-150 depending on chain style',

      benefits: [
        'Never take it off or lose it',
        'No clasp to fumble with',
        'Perfect for sentimental meaning',
        'Water-safe and durable',
        'Great group activity',
      ],
    },
    {
      serviceSlug: 'botox-treatment',
      serviceName: 'Botox',
      categorySlug: 'specialty',
      categoryName: 'Specialty',

      tagline: 'Smooth what moves',
      philosophy: 'Prevention meets correction - age gracefully on your terms',

      idealFor: [
        'Those wanting to prevent or treat fine lines',
        'Anyone with forehead lines, frown lines, or crow\'s feet',
        'Those wanting a refreshed, relaxed appearance',
        'Preventative anti-aging (starting in late 20s)',
        'Anyone wanting to look rested',
      ],

      theLook: `Relaxed, refreshed, and still 100% you. Good Botox doesn't freeze
your face - it softens wrinkles while preserving natural expression. You'll
just look like you had a really good vacation.`,

      process: `Grace (our Nurse Injector) will assess your facial muscles and
discuss your goals. Small amounts of Botox are injected into targeted muscles
using tiny needles. Most clients describe it as a small pinch.`,

      duration: '15-30 minutes',
      maintenance: 'Every 3-4 months',
      longevity: '3-4 months',
      priceRange: '$12-14 per unit (most treatments 20-60 units)',

      benefits: [
        'Smooths existing wrinkles',
        'Prevents new lines from forming',
        'Quick and virtually painless',
        'No downtime',
        'Results in 3-7 days, full effect at 2 weeks',
      ],

      preparation: [
        'Avoid blood thinners for a week if possible',
        'No alcohol for 24 hours',
        'Come with a clean face',
        'Plan to avoid strenuous exercise same day',
      ],

      aftercare: [
        'No lying down for 4 hours',
        'Avoid strenuous exercise for 24 hours',
        'Don\'t massage or touch the area',
        'Avoid heat (saunas, hot yoga) for 24 hours',
      ],
    },
  ],

  discoveryQuestions: [
    {
      question: 'What brings you to our specialty services?',
      options: [
        { label: 'Permanent jewelry with friends/loved ones', leadsTo: 'permanent-jewelry', matchesStyle: ['permanent-jewelry'] },
        { label: 'Anti-aging treatments (Botox)', leadsTo: 'botox', matchesStyle: ['botox'] },
        { label: 'Other injectable treatments', leadsTo: 'injectables', matchesStyle: ['botox', 'fillers'] },
      ],
    },
  ],
}

// ============================================================================
// EXPORT ALL CONTENT
// ============================================================================

export const ALL_CATEGORY_CONTENT: CategoryEducation[] = [
  LASHES_EDUCATION,
  BROWS_EDUCATION,
  FACIALS_EDUCATION,
  PERMANENT_MAKEUP_EDUCATION,
  WAXING_EDUCATION,
  SPECIALTY_EDUCATION,
]

export function getCategoryEducation(categorySlug: string): CategoryEducation | undefined {
  return ALL_CATEGORY_CONTENT.find((c) => c.categorySlug === categorySlug)
}

export function getServiceEducation(serviceSlug: string): ServiceEducation | undefined {
  for (const category of ALL_CATEGORY_CONTENT) {
    const service = category.styles.find((s) => s.serviceSlug === serviceSlug)
    if (service) return service
  }
  return undefined
}

export function getAllServiceEducation(): ServiceEducation[] {
  return ALL_CATEGORY_CONTENT.flatMap((c) => c.styles)
}
