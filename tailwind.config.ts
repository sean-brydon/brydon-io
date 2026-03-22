import type { Config } from 'tailwindcss'

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './content/**/*.mdx',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        mono: 'var(--font-mono)',
      },
      colors: {
        // Primary brand colors with indigo accents
        indigo: {
          400: '#8b5cf6',
          500: '#6366f1', // Primary accent
          600: '#4f46e5', // Hover state
          700: '#4338ca',
        },
        // Theme-aware semantic colors
        background: {
          DEFAULT: '#fafafa', // Light mode default
          dark: '#050505',    // Dark mode default
        },
        foreground: {
          DEFAULT: '#1a1a1a', // Light mode text
          dark: '#e0e0e0',    // Dark mode text
        },
        muted: {
          DEFAULT: '#6b7280', // Light mode muted
          dark: '#9ca3af',    // Dark mode muted
        },
        border: {
          DEFAULT: '#e5e7eb', // Light mode border
          dark: '#374151',    // Dark mode border
        },
        // Note: CSS custom properties are now defined in @theme in globals.css
      },
      maxWidth: {
        'content': 'var(--max-width-content)',
        'prose': 'var(--max-width-prose)',
      },
      spacing: {
        '18': 'var(--spacing-18)',
        '88': 'var(--spacing-88)',
      },
      animation: {
        'fade-in': 'var(--animation-fade-in)',
        'slide-up': 'var(--animation-slide-up)',
        'slide-down': 'var(--animation-slide-down)',
        'bounce-gentle': 'var(--animation-bounce-gentle)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '65ch',
            color: 'var(--text-primary)',
            lineHeight: '1.7',
          },
        },
      },
    },
  },
  plugins: [],
} satisfies Config