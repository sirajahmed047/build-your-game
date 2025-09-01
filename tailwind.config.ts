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
        // Primary soothing palette
        sage: {
          50: '#f6f7f6',
          100: '#e3e8e3',
          200: '#c7d2c7',
          300: '#a1b4a1',
          400: '#7a947a',
          500: '#5f7a5f',
          600: '#4a5e4a',
          700: '#3d4e3d',
          800: '#334033',
          900: '#2c362c',
        },
        ocean: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        warm: {
          50: '#fefdf8',
          100: '#fdf8ed',
          200: '#f9ebd0',
          300: '#f4d8a7',
          400: '#edc071',
          500: '#e6a84a',
          600: '#d89232',
          700: '#b57828',
          800: '#915f27',
          900: '#764f23',
        },
        neutral: {
          50: '#fafaf9',
          100: '#f4f4f3',
          200: '#e5e5e4',
          300: '#d1d1cf',
          400: '#b3b3b1',
          500: '#9b9b98',
          600: '#82827f',
          700: '#6b6b68',
          800: '#5a5a57',
          900: '#4d4d4a',
        },
        accent: {
          purple: '#8B7EC8',
          coral: '#F4A584',
          mint: '#A8E6CF',
          lavender: '#DCD0FF',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-sage': 'linear-gradient(135deg, #f6f7f6 0%, #e3e8e3 100%)',
        'gradient-ocean': 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        'gradient-warm': 'linear-gradient(135deg, #fefdf8 0%, #fdf8ed 100%)',
        'gradient-sunset': 'linear-gradient(135deg, #f0f9ff 0%, #fefdf8 50%, #fdf8ed 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'scale-in': 'scaleIn 0.4s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.03)',
      },
    },
  },
  plugins: [],
}
export default config