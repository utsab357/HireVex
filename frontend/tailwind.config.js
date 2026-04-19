/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0b1326',
          container: {
            lowest: '#0f1729',
            low: '#131b2e',
            DEFAULT: '#1a2236',
            high: '#222a3f',
            highest: '#2d3449',
          }
        },
        primary: {
          DEFAULT: '#bdc2ff',
          container: '#7c87f3',
        },
        secondary: {
          DEFAULT: '#c5c0d0',
          container: '#3e3850',
        },
        tertiary: {
          DEFAULT: '#ffb783',
          container: '#6b4020',
        },
        on: {
          surface: {
            DEFAULT: '#e4e1e9',
            variant: '#c8c5d0',
          },
          primary: '#1a1b2e',
        },
        status: {
          success: '#4ade80',
          warning: '#fbbf24',
          error: '#f87171',
          info: '#60a5fa',
        },
        outline: {
          variant: '#49454f',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #bdc2ff, #7c87f3)',
        'gradient-cta': 'linear-gradient(135deg, #7c87f3, #6366f1)',
      }
    },
  },
  plugins: [],
}
