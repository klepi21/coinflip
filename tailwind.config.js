/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#84cc16', // lime-500
          hover: '#65a30d', // lime-600
          light: '#ecfccb', // lime-100
        },
        surface: {
          light: {
            DEFAULT: '#ffffff',
            card: 'rgba(255, 255, 255, 0.8)',
            hover: 'rgba(245, 245, 244, 0.8)', // stone-100
          },
          dark: {
            DEFAULT: '#18181b', // stone-900
            card: 'rgba(28, 25, 23, 0.6)', // stone-900/60
            hover: 'rgba(41, 37, 36, 0.3)', // stone-800/30
          }
        },
        border: {
          light: '#e7e5e4', // stone-200
          dark: '#292524', // stone-800
        }
      },
      backdropBlur: {
        'xl': '24px',
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};