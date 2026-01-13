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
        // These reference CSS variables in globals.css for single source of truth
        // Using <alpha-value> syntax to support Tailwind opacity modifiers (e.g., text-dune/50)
        'ivory': 'rgb(var(--ivory) / <alpha-value>)',             // #faf6f2 - Main background
        'cream': 'rgb(var(--cream) / <alpha-value>)',             // #f0e0db - Accent background
        'blush-light': 'rgb(var(--blush-light) / <alpha-value>)', // #f0e0db - Subtle highlights
        'peach': 'rgb(var(--peach) / <alpha-value>)',             // #eed9c8 - Soft accents
        'blush': 'rgb(var(--blush) / <alpha-value>)',             // #e9d1c8 - Light accent
        'rose-mist': 'rgb(var(--rose-mist) / <alpha-value>)',     // #e2c2b6 - Medium accent
        'dusty-rose': 'rgb(var(--dusty-rose) / <alpha-value>)',   // #dbb2a4 - Primary accent
        'terracotta-light': 'rgb(var(--terracotta-light) / <alpha-value>)', // #c46b4e - Warm accent
        'terracotta': 'rgb(var(--terracotta) / <alpha-value>)',   // #b5563d - Primary brand color (matches logo)
        'rust': 'rgb(var(--rust) / <alpha-value>)',               // #ac4d3c - Deep accent / CTA
        'charcoal': '#3d3632',                    // Warm dark grey for headlines

        // Legacy colors (reference CSS variables)
        'sage': 'rgb(var(--sage) / <alpha-value>)',
        'warm-sand': 'rgb(var(--warm-sand) / <alpha-value>)',
        'golden': 'rgb(var(--golden) / <alpha-value>)',
        'gold': 'rgb(var(--gold) / <alpha-value>)',           // Rich gold for stars & accents
        'ocean-mist': 'rgb(var(--ocean-mist) / <alpha-value>)',
        'dune': 'rgb(var(--dune) / <alpha-value>)',

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
        sans: ['Zilla Slab', 'serif'],
        serif: ['Zilla Slab', 'serif'],
        lato: ['Lato', 'sans-serif'],
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