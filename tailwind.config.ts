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
        'sage': 'rgb(161, 151, 129)',
        'dusty-rose': 'rgb(205, 168, 158)',
        'warm-sand': 'rgb(235, 224, 203)',
        'golden': 'rgb(212, 175, 117)',
        'terracotta': 'rgb(189, 136, 120)',
        'ocean-mist': 'rgb(188, 201, 194)',
        'cream': 'rgb(250, 247, 241)',
        'dune': 'rgb(138, 124, 105)'
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        serif: ['Libre Baskerville', 'serif']
      },
      animation: {
        'fade-in': 'fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'float': 'float 6s cubic-bezier(0.4, 0, 0.2, 1) infinite'
      }
    },
  },
  plugins: [],
}

export default config