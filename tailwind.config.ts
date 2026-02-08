import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ozio: {
          dark: '#0A0E1A',
          darker: '#060911',
          card: '#1A1F2E',
          blue: '#2E5CFF',
          purple: '#8B5CF6',
          orange: '#FF8A00',
        },
        ambience: {
          low: '#10b981',
          'low-light': '#6ee7b7',
          medium: '#f59e0b',
          'medium-light': '#fcd34d',
          high: '#ef4444',
          'high-light': '#fca5a5',
        },
        gray: {
          850: '#1F2937',
          950: '#0F1419',
        },
      },
      backgroundImage: {
        'gradient-story': 'linear-gradient(135deg, #fbbf24 0%, #ef4444 50%, #ec4899 100%)',
      },
    },
  },
  plugins: [],
}

export default config