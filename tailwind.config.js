/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'forest-deep': '#1C2B1E',
        'forest-mid': '#2D4A30',
        'forest-canopy': '#3D6B42',
        sage: '#7A9E7E',
        fern: '#A8C5A0',
        ivory: '#F2EDE4',
        cream: '#E8DFD0',
        gold: '#C9A96E',
        bark: '#6B4F3A',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
