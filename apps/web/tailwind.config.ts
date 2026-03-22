import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#0b0d11',
        surface:  '#111318',
        card:     '#161920',
        border:   '#1f2330',
        border2:  '#2a3045',
        accent:   '#4fffb0',
        accent2:  '#4dc9ff',
        accent3:  '#ff6b6b',
        accent4:  '#ffca3a',
        purple:   '#a78bfa',
        muted:    '#5a6480',
        dim:      '#3a4260',
      },
      fontFamily: {
        sans: ['Syne', 'sans-serif'],
        mono: ['Azeret Mono', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config
