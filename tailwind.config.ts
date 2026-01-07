import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // LashPop Brand Palette (light to dark)
        'ivory': '#faf6f2',           // Light warm cream for backgrounds
        'cream': '#f0e0db',           // Accent background (pinkish cream)
        'blush-light': '#f0e0db',     // Subtle highlights
        'peach': '#eed9c8',           // Soft accents
        'blush': '#e9d1c8',           // Light accent
        'rose-mist': '#e2c2b6',       // Medium accent
        'dusty-rose': '#dbb2a4',      // Primary accent
        'terracotta-light': '#d3a392', // Warm accent
        'terracotta': '#cc947f',      // Primary brand color
        'rust': '#ac4d3c',            // Deep accent / CTA
        'charcoal': '#3d3632',        // Warm dark grey for headlines

        // Legacy colors (for compatibility)
        'sage': 'rgb(161, 151, 129)',
        'warm-sand': 'rgb(235, 224, 203)',
        'golden': 'rgb(212, 175, 117)',
        'ocean-mist': 'rgb(188, 201, 194)',
        'dune': 'rgb(138, 124, 105)',

        // Category Brand Colors
        'category-lashes': '#dbb2a4',
        'category-brows': '#cc947f',
        'category-permanent-makeup': '#d3a392',
        'category-facials': '#e2c2b6',
        'category-waxing': '#e9d1c8',
        'category-specialty': '#cc947f',
        'category-bundles': '#dbb2a4',
      },
      fontFamily: {
        sans: ['Lato', 'sans-serif'],
        serif: ['Zilla Slab', 'serif'],
        caption: ['TikTok Sans', 'sans-serif'],
        josefin: ['var(--font-josefin)', 'serif'],
        chivo: ['var(--font-chivo)', 'sans-serif'],
        andika: ['var(--font-andika)', 'sans-serif'],
        'league-script': ['var(--font-league-script)', 'cursive'],
        swanky: ['var(--font-swanky)', 'cursive'],
        licorice: ['var(--font-licorice)', 'cursive'],
        corey: ['Corey Nice', 'cursive'],
      },
      animation: {
        'fade-in': 'fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'float': 'float 6s cubic-bezier(0.4, 0, 0.2, 1) infinite'
      },
      spacing: {
        'safe-top': 'var(--safe-area-inset-top)',
        'safe-bottom': 'var(--safe-area-inset-bottom)',
        'safe-left': 'var(--safe-area-inset-left)',
        'safe-right': 'var(--safe-area-inset-right)',
      },
      padding: {
        'safe-top': 'var(--safe-area-inset-top)',
        'safe-bottom': 'var(--safe-area-inset-bottom)',
        'safe-left': 'var(--safe-area-inset-left)',
        'safe-right': 'var(--safe-area-inset-right)',
      },
      margin: {
        'safe-top': 'var(--safe-area-inset-top)',
        'safe-bottom': 'var(--safe-area-inset-bottom)',
        'safe-left': 'var(--safe-area-inset-left)',
        'safe-right': 'var(--safe-area-inset-right)',
      },
    },
  },
  plugins: [],
}

export default config