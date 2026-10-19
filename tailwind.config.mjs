/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#07090E',
          surface: '#0F1420',
          raised: '#161D2E',
          border: '#1B2338',
          subtle: '#131929',
        },
        telemetry: {
          DEFAULT: '#00D2FF',
          dark: '#021824',
          hover: '#33DCFF',
          glow: 'rgba(0, 210, 255, 0.25)',
        },
        domain: {
          audio: '#10B981',
          ai: '#6366F1',
          algo: '#F43F5E',
          beer: '#F59E0B',
        },
        brand: {
          400: '#00D2FF',
          500: '#00B8E6',
          600: '#009EC7',
        }
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"Fira Code"', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        'tech': '6px',
        'tech-sm': '4px',
        'tech-lg': '8px',
      },
      boxShadow: {
        'glow-cyan': '0 0 35px -5px rgba(0, 210, 255, 0.25)',
        'glow-audio': '0 0 35px -5px rgba(16, 185, 129, 0.25)',
        'glow-ai': '0 0 35px -5px rgba(99, 102, 241, 0.25)',
      }
    },
  },
  plugins: [],
};
