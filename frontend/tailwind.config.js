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
          canvas: '#F1F5F9',
          bg: '#FFFFFF',
          card: '#FFFFFF',
          panel: '#F8FAFC',
          subtle: '#EEF2F6',
          highlight: '#E2E8F0',
          night: '#0F172A'
        },
        border: {
          dim: '#CBD5E1',
          strong: '#94A3B8',
          focus: '#4F46E5',
          ferrari: '#E11D48',
          sentry: '#EA580C'
        },
        brand: {
          primary: '#0F172A',
          secondary: '#334155',
          accent: '#4F46E5',
          indigo: '#4F46E5',
          emerald: '#059669',
          amber: '#D97706',
          rose: '#E11D48'
        },
        severity: {
          critical: '#E11D48',
          high: '#EA580C',
          medium: '#D97706',
          low: '#2563EB',
          info: '#64748B'
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
}
