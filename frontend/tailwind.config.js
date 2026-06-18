/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          900: '#06231D',
          800: '#0E4B43',
          700: '#16685D',
          600: '#223148',
        },
        secondary: {
          100: '#F4F1EA',
          200: '#E8E2D8',
          300: '#D2C7B8',
        },
        accent: {
          green: '#22C55E',
          greenLight: '#4ADE80',
          blue: '#3B82F6',
          blueLight: '#60A5FA',
        },
        semantic: {
          success: '#22C55E',
          warning: '#F59E0B',
          danger: '#EF4444',
          info: '#3B82F6',
        },
      },
      borderRadius: {
        card: '16px',
        button: '12px',
        input: '12px',
        avatar: '999px',
      },
      boxShadow: {
        card: '0 8px 32px rgba(0,0,0,0.15)',
        hover: '0 12px 40px rgba(34,197,94,0.20)',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      fontFamily: {
        sans: ['Helvetica', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
