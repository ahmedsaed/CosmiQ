/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Background layers
        'space': '#0a0e1a',
        'panel': '#121828',
        'card': '#1a2035',
        'hover': '#232d45',
        
        // Accents
        'primary': '#00d9ff',
        'secondary': '#a855f7',
        'success': '#10b981',
        'warning': '#f59e0b',
        'danger': '#ef4444',
        
        // Text
        'text': {
          'primary': '#e5e7eb',
          'secondary': '#9ca3af',
          'tertiary': '#6b7280',
        },
        
        // Borders
        'border': {
          DEFAULT: '#2d3748',
          'focus': '#00d9ff',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(0, 217, 255, 0.3)',
        'glow-secondary': '0 0 20px rgba(168, 85, 247, 0.3)',
        'glow-card': '0 0 30px rgba(0, 217, 255, 0.1)',
      },
      backdropBlur: {
        'glass': '12px',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 217, 255, 0.2)' },
          '50%': { boxShadow: '0 0 30px rgba(0, 217, 255, 0.4)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
