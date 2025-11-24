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
        // Primary Palette
        'sage': 'rgb(161, 151, 129)',
        'dusty-rose': 'rgb(205, 168, 158)',
        'warm-sand': 'rgb(235, 224, 203)',
        'golden': 'rgb(212, 175, 117)',
        'terracotta': 'rgb(189, 136, 120)',
        'ocean-mist': 'rgb(188, 201, 194)',
        'cream': 'rgb(250, 247, 241)',
        'dune': 'rgb(138, 124, 105)',

        // Category Brand Colors
        'category-lashes': 'rgb(205, 168, 158)',
        'category-brows': 'rgb(212, 175, 117)',
        'category-permanent-makeup': 'rgb(189, 136, 120)',
        'category-facials': 'rgb(188, 201, 194)',
        'category-waxing': 'rgb(161, 151, 129)',
        'category-specialty': 'rgb(212, 175, 117)',
        'category-bundles': 'rgb(205, 168, 158)',
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        serif: ['Libre Baskerville', 'serif'],
        caption: ['TikTok Sans', 'sans-serif'],
        josefin: ['var(--font-josefin)', 'serif'],
        chivo: ['var(--font-chivo)', 'sans-serif'],
        andika: ['var(--font-andika)', 'sans-serif'],
        'league-script': ['var(--font-league-script)', 'cursive'],
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